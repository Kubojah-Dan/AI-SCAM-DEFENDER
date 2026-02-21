import hashlib
import json
import logging
import os
import re
import subprocess
import tempfile
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
try:
    import magic
    import yara
    from werkzeug.utils import secure_filename
except ImportError:
    magic = None
    yara = None
    print("Warning: magic or yara modules not available. Some features will be limited.")

LOGGER = logging.getLogger(__name__)

class SandboxService:
    """Secure sandbox service for analyzing emails and files in isolation."""
    
    def __init__(self):
        self.sandbox_dir = Path(tempfile.mkdtemp(prefix="scamdefender_sandbox_"))
        self.temp_dir = Path(tempfile.mkdtemp(prefix="scamdefender_temp_"))
        
    def __enter__(self):
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.cleanup()
        
    def cleanup(self):
        """Clean up sandbox directories."""
        try:
            import shutil
            if self.sandbox_dir.exists():
                shutil.rmtree(self.sandbox_dir)
            if self.temp_dir.exists():
                shutil.rmtree(self.temp_dir)
        except Exception as e:
            LOGGER.error(f"Sandbox cleanup failed: {e}")
    
    def analyze_email(self, email_content: str, email_headers: Dict = None) -> Dict:
        """Analyze email content in secure sandbox."""
        try:
            analysis_id = f"email_{int(time.time())}"
            sandbox_path = self.sandbox_dir / analysis_id
            
            # Create analysis directory
            sandbox_path.mkdir(parents=True, exist_ok=True)
            
            # Save email to sandbox
            email_file = sandbox_path / "email.eml"
            with open(email_file, 'w', encoding='utf-8') as f:
                f.write(email_content)
            
            # Perform static analysis
            static_result = self._static_email_analysis(email_content, email_headers)
            
            # Extract and analyze attachments
            attachments = self._extract_attachments(email_content, sandbox_path)
            attachment_results = []
            for attachment in attachments:
                result = self.analyze_file(attachment['path'], attachment['filename'])
                attachment_results.append(result)
            
            # Extract and analyze URLs
            urls = self._extract_urls(email_content)
            url_results = []
            for url in urls:
                result = self._analyze_url(url)
                url_results.append(result)
            
            # ML-based scoring
            ml_result = self._ml_email_scoring(email_content)
            
            # Combine all results
            final_score = self._calculate_risk_score(
                static_result['risk_score'],
                ml_result.get('risk_score', 0),
                len(attachment_results),
                len(url_results)
            )
            
            return {
                "analysis_id": analysis_id,
                "status": self._determine_status(final_score),
                "risk_score": final_score,
                "threat_type": self._determine_threat_type(final_score, static_result, ml_result),
                "explanation": self._generate_explanation(final_score, static_result, ml_result, url_results, attachment_results),
                "static_analysis": static_result,
                "ml_analysis": ml_result,
                "attachments": attachment_results,
                "urls": url_results,
                "timestamp": datetime.utcnow().isoformat(),
                "sandbox_path": str(sandbox_path)
            }
            
        except Exception as e:
            LOGGER.error(f"Email analysis failed: {e}")
            return {
                "status": "error",
                "error": str(e),
                "risk_score": 50,
                "threat_type": "unknown",
                "explanation": f"Analysis failed: {str(e)}"
            }
    
    def analyze_file(self, file_path: str, filename: str) -> Dict:
        """Analyze file in secure sandbox."""
        try:
            analysis_id = f"file_{int(time.time())}_{secure_filename(filename)}"
            sandbox_path = self.sandbox_dir / analysis_id
            
            # Copy file to sandbox
            import shutil
            shutil.copy2(file_path, sandbox_path / secure_filename(filename))
            
            # Static analysis
            static_result = self._static_file_analysis(sandbox_path / secure_filename(filename))
            
            # Dynamic analysis (behavior monitoring)
            dynamic_result = self._dynamic_file_analysis(sandbox_path / secure_filename(filename))
            
            # ML-based scoring
            ml_result = self._ml_file_scoring(sandbox_path / secure_filename(filename))
            
            # Combine results
            final_score = self._calculate_risk_score(
                static_result['risk_score'],
                ml_result.get('risk_score', 0),
                dynamic_result.get('risk_score', 0)
            )
            
            return {
                "analysis_id": analysis_id,
                "status": self._determine_status(final_score),
                "risk_score": final_score,
                "threat_type": self._determine_threat_type(final_score, static_result, ml_result),
                "explanation": self._generate_explanation(final_score, static_result, ml_result, dynamic_result),
                "static_analysis": static_result,
                "dynamic_analysis": dynamic_result,
                "ml_analysis": ml_result,
                "timestamp": datetime.utcnow().isoformat(),
                "file_hash": self._calculate_file_hash(file_path),
                "sandbox_path": str(sandbox_path)
            }
            
        except Exception as e:
            LOGGER.error(f"File analysis failed: {e}")
            return {
                "status": "error",
                "error": str(e),
                "risk_score": 50,
                "threat_type": "unknown",
                "explanation": f"Analysis failed: {str(e)}"
            }
    
    def _static_email_analysis(self, content: str, headers: Dict = None) -> Dict:
        """Perform static email analysis."""
        risk_score = 0
        indicators = []
        
        # Check sender domain reputation
        if headers and 'From' in headers:
            sender = headers['From']
            if self._is_suspicious_domain(sender):
                risk_score += 20
                indicators.append("Suspicious sender domain")
        
        # Phishing pattern detection
        phishing_patterns = [
            r'urgent.*action.*required',
            r'verify.*account.*immediately',
            r'click.*here.*suspend',
            r'winner.*lottery.*claim',
            r'irs.*tax.*refund',
            r'bank.*security.*update'
        ]
        
        for pattern in phishing_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                risk_score += 25
                indicators.append(f"Phishing pattern detected: {pattern}")
        
        # Malicious URL detection
        urls = self._extract_urls(content)
        for url in urls:
            if self._is_suspicious_url(url):
                risk_score += 15
                indicators.append(f"Suspicious URL: {url}")
        
        # Attachment analysis
        if 'attachment' in content.lower():
            risk_score += 10
            indicators.append("Email contains attachments")
        
        return {
            "risk_score": min(risk_score, 100),
            "indicators": indicators,
            "content_type": self._detect_content_type(content)
        }
    
    def _static_file_analysis(self, file_path: Path) -> Dict:
        """Perform static file analysis."""
        try:
            # File type detection
            if magic:
                file_type = magic.from_file(str(file_path))
            else:
                file_type = "Unknown"
            
            # Calculate file hash
            file_hash = self._calculate_file_hash(file_path)
            
            risk_score = 0
            indicators = []
            
            # Executable files
            if any(ext in file_path.name.lower() for ext in ['.exe', '.bat', '.cmd', '.scr', '.ps1']):
                risk_score += 40
                indicators.append("Executable file detected")
            
            # Script files
            if any(ext in file_path.name.lower() for ext in ['.js', '.vbs', '.jar', '.app']):
                risk_score += 30
                indicators.append("Script file detected")
            
            # Office documents with macros
            if file_path.name.lower().endswith(('.doc', '.xls', '.ppt')) and 'macro' in str(file_type).lower():
                risk_score += 35
                indicators.append("Office document with potential macros")
            
            # Large files
            file_size = file_path.stat().st_size
            if file_size > 10 * 1024 * 1024:  # 10MB
                risk_score += 15
                indicators.append(f"Large file: {file_size / (1024*1024):.1f}MB")
            
            return {
                "risk_score": min(risk_score, 100),
                "indicators": indicators,
                "file_type": file_type,
                "file_size": file_size,
                "file_hash": file_hash
            }
            
        except Exception as e:
            LOGGER.error(f"Static file analysis failed: {e}")
            return {"risk_score": 50, "indicators": [f"Analysis error: {str(e)}"]}
    
    def _dynamic_file_analysis(self, file_path: Path) -> Dict:
        """Perform dynamic analysis in sandbox."""
        try:
            # Simulate dynamic analysis (in real implementation, this would run in VM)
            # For now, we'll do basic behavioral simulation
            
            risk_score = 0
            behaviors = []
            
            # Check for suspicious file names
            suspicious_names = ['setup', 'install', 'crack', 'keygen', 'patch', 'loader']
            if any(name in file_path.name.lower() for name in suspicious_names):
                risk_score += 20
                behaviors.append("Suspicious filename pattern")
            
            # Simulate execution monitoring (placeholder)
            # In real implementation, this would monitor:
            # - File system access
            # - Network connections
            # - Process creation
            # - Registry modifications
            # - API calls
            
            return {
                "risk_score": min(risk_score, 100),
                "behaviors": behaviors,
                "analysis_type": "dynamic_simulation"
            }
            
        except Exception as e:
            LOGGER.error(f"Dynamic file analysis failed: {e}")
            return {"risk_score": 25, "behaviors": [f"Dynamic analysis error: {str(e)}"]}
    
    def _extract_attachments(self, email_content: str, sandbox_path: Path) -> List[Dict]:
        """Extract attachments from email content."""
        attachments = []
        
        # Simple attachment extraction (placeholder)
        # In real implementation, this would parse MIME content
        
        return attachments
    
    def _extract_urls(self, content: str) -> List[str]:
        """Extract URLs from text content."""
        url_pattern = r'https?://[^\s<>"\'\)]+'
        urls = re.findall(url_pattern, content, re.IGNORECASE)
        return list(set(urls))  # Remove duplicates
    
    def _analyze_url(self, url: str) -> Dict:
        """Analyze individual URL."""
        risk_score = 0
        indicators = []
        
        # URL shorteners
        shorteners = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl']
        if any(shortener in url for shortener in shorteners):
            risk_score += 10
            indicators.append("URL shortener detected")
        
        # Suspicious domains
        if self._is_suspicious_url(url):
            risk_score += 20
            indicators.append("Suspicious domain detected")
        
        # HTTPS check
        if not url.startswith('https://'):
            risk_score += 5
            indicators.append("Non-HTTPS URL")
        
        return {
            "url": url,
            "risk_score": min(risk_score, 100),
            "indicators": indicators
        }
    
    def _ml_email_scoring(self, content: str) -> Dict:
        """ML-based email scoring (placeholder)."""
        # This would integrate with actual ML models
        # For now, return heuristic-based scoring
        
        risk_score = 0
        
        # Keyword-based scoring
        suspicious_keywords = [
            'urgent', 'immediate', 'action required', 'verify account',
            'suspended', 'winner', 'lottery', 'inheritance', 'tax refund',
            'bank transfer', 'security alert', 'click here', 'download now'
        ]
        
        keyword_count = sum(1 for keyword in suspicious_keywords if keyword.lower() in content.lower())
        risk_score = min(keyword_count * 5, 50)
        
        return {
            "risk_score": risk_score,
            "method": "keyword_heuristic",
            "confidence": 0.6
        }
    
    def _ml_file_scoring(self, file_path: Path) -> Dict:
        """ML-based file scoring (placeholder)."""
        # This would integrate with actual ML models
        # For now, return heuristic-based scoring based on file properties
        
        risk_score = 0
        
        # File extension-based scoring
        dangerous_extensions = ['.exe', '.bat', '.scr', '.vbs', '.js', '.jar']
        if any(file_path.suffix.lower() == ext for ext in dangerous_extensions):
            risk_score += 30
        
        return {
            "risk_score": min(risk_score, 100),
            "method": "extension_heuristic",
            "confidence": 0.5
        }
    
    def _calculate_risk_score(self, static_score: int, ml_score: int, *other_scores: int) -> int:
        """Calculate combined risk score."""
        scores = [static_score, ml_score] + list(other_scores)
        return min(int(sum(scores) / len(scores)), 100)
    
    def _determine_status(self, risk_score: int) -> str:
        """Determine analysis status based on risk score."""
        if risk_score < 30:
            return "safe"
        elif risk_score < 70:
            return "suspicious"
        else:
            return "malicious"
    
    def _determine_threat_type(self, risk_score: int, static_result: Dict, ml_result: Dict, *other_results: Dict) -> str:
        """Determine threat type."""
        if risk_score >= 70:
            # Check for specific malware indicators
            if any('executable' in result.get('indicators', []) for result in [static_result] + list(other_results)):
                return "malware"
            elif any('script' in result.get('indicators', []) for result in [static_result] + list(other_results)):
                return "script_malware"
            else:
                return "malicious"
        elif risk_score >= 40:
            return "phishing"
        elif risk_score >= 25:
            return "scam"
        else:
            return "suspicious"
    
    def _generate_explanation(self, risk_score: int, static_result: Dict, ml_result: Dict, *other_results: Dict) -> str:
        """Generate human-readable explanation."""
        explanations = []
        
        if risk_score >= 70:
            explanations.append("High-risk indicators detected")
        elif risk_score >= 40:
            explanations.append("Suspicious patterns identified")
        elif risk_score >= 25:
            explanations.append("Potentially risky content")
        else:
            explanations.append("Low-risk indicators detected")
        
        # Add specific indicators
        all_results = [static_result, ml_result] + list(other_results)
        for result in all_results:
            if 'indicators' in result:
                explanations.extend(result['indicators'][:3])  # Limit to top 3
        
        return "; ".join(explanations)
    
    def _is_suspicious_domain(self, email_or_url: str) -> bool:
        """Check if domain is suspicious."""
        try:
            # Extract domain from email or URL
            if '@' in email_or_url:
                domain = email_or_url.split('@')[1].split('<')[0].strip()
            else:
                from urllib.parse import urlparse
                domain = urlparse(email_or_url).netloc
            
            # Suspicious TLDs and patterns
            suspicious_patterns = [
                '.tk', '.ml', '.ga', '.cf',  # Free TLDs often abused
                'secure-', 'verify-', 'confirm-',  # Phishing patterns
                'no-reply', 'noreply',  # Common in spam
                'bit.ly', 'tinyurl', 't.co'  # URL shorteners
            ]
            
            return any(pattern in domain.lower() for pattern in suspicious_patterns)
        except:
            return False
    
    def _is_suspicious_url(self, url: str) -> bool:
        """Check if URL is suspicious."""
        suspicious_patterns = [
            'bit.ly', 'tinyurl.com', 't.co', 'goo.gl',
            'secure-', 'verify-', 'confirm-',
            'login', 'signin', 'account', 'update',
            'suspended', 'blocked', 'urgent'
        ]
        
        return any(pattern in url.lower() for pattern in suspicious_patterns)
    
    def _detect_content_type(self, content: str) -> str:
        """Detect email content type."""
        if 'html' in content.lower():
            return 'html'
        elif any(word in content.lower() for word in ['unsubscribe', 'marketing', 'promotion']):
            return 'marketing'
        else:
            return 'text'
    
    def _calculate_file_hash(self, file_path: Path) -> str:
        """Calculate SHA-256 hash of file."""
        sha256_hash = hashlib.sha256()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b''):
                sha256_hash.update(chunk)
        return sha256_hash.hexdigest()
    
    def secure_filename(self, filename: str) -> str:
        """Generate secure filename."""
        name = secure_filename(filename)
        name = name.replace(' ', '_').lower()
        return f"{int(time.time())}_{name}"
