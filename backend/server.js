const express = require('express');
const oracledb = require('oracledb');
const bodyParser = require('body-parser');
const cors = require('cors');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Store active tasks
const tasks = {};

// Route to handle database query scheduling
app.post('/schedule-query', async (req, res) => {
  const { user, password, connectString, sqlQuery, cronExpression, outputFile } = req.body;

  // Validate the cron expression
  if (!cron.validate(cronExpression)) {
    return res.status(400).json({ success: false, error: 'Invalid cron expression' });
  }

  // Generate a unique task ID
  const taskId = `task-${Date.now()}`;

  // Create a new cron job
  const task = cron.schedule(cronExpression, async () => {
    let connection;
    try {
      connection = await oracledb.getConnection({ user, password, connectString });
      const result = await connection.execute(sqlQuery);
      const columnNames = result.metaData.map(col => col.name);

      // Prepare data to be written to file
      const data = result.rows.map(row => {
        let obj = {};
        columnNames.forEach((col, index) => {
          obj[col] = row[index];
        });
        return obj;
      });

      // Convert data to single-line nested JSON strings and append to file
      const output = data.map(item => JSON.stringify(item)).join('\n') + '\n';
      fs.appendFileSync(path.resolve(__dirname, outputFile), output, 'utf8');
      console.log(`Query results appended to ${outputFile}`);
    } catch (err) {
      console.error(`Error executing query: ${err.message}`);
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.error(err);
        }
      }
    }
  });

  // Store the task
  tasks[taskId] = task;

  res.json({ success: true, taskId });
});

// Route to stop a scheduled task
app.post('/stop-task', (req, res) => {
  const { taskId } = req.body;

  const task = tasks[taskId];
  if (task) {
    task.stop();
    delete tasks[taskId];
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: 'Task not found' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

