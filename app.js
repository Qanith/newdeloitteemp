// app.js
const express = require('express');
const { Pool } = require('pg');
const { engine } = require('express-handlebars');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');


const app = express();

// Replace with your actual database credentials
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'deloitte_db',
    password: 'root',
    port: 5432, // Default PostgreSQL port
});

// Middleware setup
app.engine('handlebars', engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

// Middleware to parse request bodies
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(methodOverride('_method'));

// Function to insert a new employee into the database
const insertEmployee = async (employeeData) => {
    const { name, department, position } = employeeData;
    try {
        const query = 'INSERT INTO employees (name, department, position) VALUES ($1, $2, $3) RETURNING *';
        const values = [name, department, position];
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error('Error inserting employee', error);
        throw error;
    }
};

// Route to display a form for adding a new employee
app.get('/add', (req, res) => {
    res.render('add_employee');
});

// Route to handle form submission for adding a new employee
app.post('/add', async (req, res) => {
    try {
        const employeeData = req.body;
        const newEmployee = await insertEmployee(employeeData);
        res.redirect('/employees');
    } catch (error) {
        res.status(500).send('Error adding employee');
    }
});

// Route to display all employees
app.get('/employees', async (req, res) => {
    try {
        const query = 'SELECT * FROM employees';
        const result = await pool.query(query);
        const employees = result.rows;
        res.render('employees', { employees });
    } catch (error) {
        res.status(500).send('Error retrieving employees');
    }
});

app.put('/employees/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, department, position } = req.body;
        const query = 'UPDATE employees SET name = $1, department = $2, position = $3 WHERE id = $4 RETURNING *';
        const values = [name, department, position, id];
        const result = await pool.query(query, values);
        const updatedEmployee = result.rows[0];
        res.send(updatedEmployee);
    } catch (error) {
        res.status(500).send('Error updating employee');
    }
});

// Route to delete an employee (HTTP DELETE)
app.delete('/employees/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'DELETE FROM employees WHERE id = $1 RETURNING *';
        const values = [id];
        const result = await pool.query(query, values);
        const deletedEmployee = result.rows[0];
        res.send(deletedEmployee);
    } catch (error) {
        res.status(500).send('Error deleting employee');
    }
});

// Route to display the form for updating an employee (HTTP GET)
app.get('/employees/:id/edit', async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'SELECT * FROM employees WHERE id = $1';
        const values = [id];
        const result = await pool.query(query, values);
        const employee = result.rows[0];
        res.render('edit_employee', { employee });
    } catch (error) {
        res.status(500).send('Error retrieving employee for edit');
    }
});


// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
