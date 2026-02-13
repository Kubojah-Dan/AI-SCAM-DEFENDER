const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Store the latest uploaded file info
let latestUploadedFile = null;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../uploads');
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
      cb(null, uploadsDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Upload CSV file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;
    
    // Copy file to temp directory for execution
    const tempDir = path.join(__dirname, '../temp');
    await fs.mkdir(tempDir, { recursive: true });
    
    // Create a clean filename for the temp directory
    const tempFileName = fileName;
    const tempFilePath = path.join(tempDir, tempFileName);
    
    // Copy the uploaded file to temp directory
    await fs.copyFile(filePath, tempFilePath);
    
    // Store the latest uploaded file info
    latestUploadedFile = {
      originalName: fileName,
      tempPath: tempFilePath,
      uploadPath: filePath
    };
    
    // Read and parse CSV
    const results = [];
    const columns = [];
    
    await new Promise((resolve, reject) => {
      require('fs').createReadStream(filePath)
        .pipe(csv())
        .on('headers', (headers) => {
          columns.push(...headers);
        })
        .on('data', (data) => {
          results.push(data);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Create dataset info
    const dataset = {
      id: req.file.filename,
      name: fileName,
      columns: columns,
      shape: [results.length, columns.length],
      preview: results.slice(0, 5),
      filePath: filePath,
      tempPath: tempFilePath
    };

    res.json(dataset);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload and process file' });
  }
});

// Get latest uploaded file info
router.get('/latest-upload', (req, res) => {
  try {
    if (latestUploadedFile) {
      res.json({
        success: true,
        file: latestUploadedFile
      });
    } else {
      res.json({
        success: false,
        message: 'No files uploaded yet'
      });
    }
  } catch (error) {
    console.error('Error getting latest upload:', error);
    res.status(500).json({ error: 'Failed to get latest upload info' });
  }
});

// Get dataset info
router.get('/datasets/:id', async (req, res) => {
  try {
    const datasetId = req.params.id;
    const filePath = path.join(__dirname, '../uploads', datasetId);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    // Read and parse CSV
    const results = [];
    const columns = [];
    
    await new Promise((resolve, reject) => {
      require('fs').createReadStream(filePath)
        .pipe(csv())
        .on('headers', (headers) => {
          columns.push(...headers);
        })
        .on('data', (data) => {
          results.push(data);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    const dataset = {
      id: datasetId,
      name: datasetId,
      columns: columns,
      shape: [results.length, columns.length],
      preview: results.slice(0, 10),
      data: results
    };

    res.json(dataset);
  } catch (error) {
    console.error('Error fetching dataset:', error);
    res.status(500).json({ error: 'Failed to fetch dataset' });
  }
});

// Generate EDA (Exploratory Data Analysis) for a dataset
router.post('/eda/:id', async (req, res) => {
  try {
    const datasetId = req.params.id;
    const filePath = path.join(__dirname, '../uploads', datasetId);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    // Read and parse CSV
    const results = [];
    const columns = [];
    
    await new Promise((resolve, reject) => {
      require('fs').createReadStream(filePath)
        .pipe(csv())
        .on('headers', (headers) => {
          columns.push(...headers);
        })
        .on('data', (data) => {
          results.push(data);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Generate EDA statistics
    const eda = {
      shape: [results.length, columns.length],
      columns: columns,
      columnTypes: {},
      missingValues: {},
      summaryStats: {},
      sampleData: results.slice(0, 5)
    };

    // Analyze each column
    columns.forEach(col => {
      const values = results.map(row => row[col]).filter(val => val !== '');
      const numericValues = values.map(val => parseFloat(val)).filter(val => !isNaN(val));
      
      // Determine column type
      eda.columnTypes[col] = numericValues.length > values.length * 0.8 ? 'numeric' : 'categorical';
      
      // Missing values
      eda.missingValues[col] = results.length - values.length;
      
      // Summary statistics for numeric columns
      if (eda.columnTypes[col] === 'numeric' && numericValues.length > 0) {
        eda.summaryStats[col] = {
          count: numericValues.length,
          mean: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
          min: Math.min(...numericValues),
          max: Math.max(...numericValues),
          median: numericValues.sort((a, b) => a - b)[Math.floor(numericValues.length / 2)]
        };
      } else {
        // For categorical columns, get unique values and counts
        const uniqueValues = {};
        values.forEach(val => {
          uniqueValues[val] = (uniqueValues[val] || 0) + 1;
        });
        eda.summaryStats[col] = {
          uniqueCount: Object.keys(uniqueValues).length,
          mostCommon: Object.entries(uniqueValues)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
        };
      }
    });

    res.json(eda);
  } catch (error) {
    console.error('Error generating EDA:', error);
    res.status(500).json({ error: 'Failed to generate EDA' });
  }
});

// Execute Python code
router.post('/execute', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.userId;
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const gpuService = req.app.locals.gpuService;
    const sessionId = `workspace-${Date.now()}`;
    
    // Execute the code
    const result = await gpuService.executeCode(userId, sessionId, code);
    
    res.json(result);
  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export processed data
router.post('/export/:id', async (req, res) => {
  try {
    const datasetId = req.params.id;
    const { data, filename } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    const exportFilename = filename || `export-${Date.now()}.csv`;
    const exportPath = path.join(__dirname, '../uploads', exportFilename);

    // Create CSV writer
    const csvWriter = createCsvWriter({
      path: exportPath,
      header: Object.keys(data[0]).map(key => ({ id: key, title: key }))
    });

    // Write data to CSV
    await csvWriter.writeRecords(data);

    res.json({ 
      message: 'Data exported successfully',
      filename: exportFilename,
      downloadUrl: `/api/workspace/download/${exportFilename}`
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Download exported file
router.get('/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath, filename);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// List all uploaded datasets
router.get('/datasets', async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    
    try {
      const files = await fs.readdir(uploadsDir);
      const datasets = files
        .filter(file => file.endsWith('.csv'))
        .map(file => ({
          id: file,
          name: file,
          uploadDate: new Date().toISOString() // This is a placeholder
        }));
      
      res.json(datasets);
    } catch {
      res.json([]); // Directory doesn't exist yet
    }
  } catch (error) {
    console.error('Error listing datasets:', error);
    res.status(500).json({ error: 'Failed to list datasets' });
  }
});

module.exports = router;
