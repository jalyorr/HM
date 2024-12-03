const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
    user: 'test_db_ocp8_user',      // Reemplaza con tu usuario de PostgreSQL
    host: 'dpg-ct4i993qf0us7381qa80-a',
    database: 'test_db_ocp8', // Nombre de tu base de datos
    password: 'pv1DK352ggg6V8GOTMz4c0aUFhqJPWc4', // Reemplaza con tu contraseña de PostgreSQL
    port: 5432
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Inicializar la base de datos
async function initializeDatabase() {
    try {
        // Crear tabla si no existe
        await pool.query(`
            CREATE TABLE IF NOT EXISTS rooms (
                room_number VARCHAR(10) PRIMARY KEY,
                is_vacant BOOLEAN DEFAULT false,
                maintenance_status VARCHAR(20) DEFAULT 'ready',
                housekeeping_status VARCHAR(20) DEFAULT 'clean'
            )
        `);

        // Verificar si hay habitaciones
        const roomCount = await pool.query('SELECT COUNT(*) FROM rooms');
        
        // Si no hay habitaciones, insertar algunas de ejemplo
        if (roomCount.rows[0].count === '0') {
            for (let i = 101; i <= 110; i++) {
                await pool.query(
                    'INSERT INTO rooms (room_number, is_vacant, maintenance_status, housekeeping_status) VALUES ($1, $2, $3, $4)',
                    [i.toString(), false, 'ready', 'clean']
                );
            }
        }
        console.log('Base de datos inicializada correctamente');

        // Crear tabla de empleados
        await pool.query(`
            CREATE TABLE IF NOT EXISTS employees (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                access_code VARCHAR(50) NOT NULL,
                role VARCHAR(20) NOT NULL,
                permissions TEXT[] NOT NULL
            )
        `);

        // Crear tabla de rooms (modificada para tracking)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS rooms (
                room_number VARCHAR(10) PRIMARY KEY,
                is_vacant BOOLEAN DEFAULT false,
                maintenance_status VARCHAR(20) DEFAULT 'ready',
                housekeeping_status VARCHAR(20) DEFAULT 'ready',
                last_updated_by INTEGER REFERENCES employees(id),
                last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Insertar admin por defecto si no existe
        const adminExists = await pool.query(
            'SELECT * FROM employees WHERE email = $1',
            ['admin@hotel.com']
        );

        if (adminExists.rows.length === 0) {
            await pool.query(`
                INSERT INTO employees (
                    first_name, last_name, email, access_code, role, permissions
                ) VALUES (
                    'Admin', 'User', 'admin@hotel.com', '1234', 'admin', 
                    ARRAY['housekeeping', 'maintenance', 'vacancy']
                )
            `);
        }

        // Crear tabla de historial
        await pool.query(`
            CREATE TABLE IF NOT EXISTS room_history (
                id SERIAL PRIMARY KEY,
                room_number VARCHAR(10) REFERENCES rooms(room_number),
                employee_id INTEGER REFERENCES employees(id),
                change_type VARCHAR(20) NOT NULL,
                old_value VARCHAR(50),
                new_value VARCHAR(50),
                changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Base de datos inicializada correctamente');
    } catch (error) {
        console.error('Error inicializando la base de datos:', error);
    }
}

// Rutas API
app.get('/api/rooms', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM rooms ORDER BY room_number');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/rooms/:roomNumber', async (req, res) => {
    const { roomNumber } = req.params;
    const { isVacant, maintenanceStatus, housekeepingStatus } = req.body;

    try {
        const query = `
            UPDATE rooms 
            SET is_vacant = COALESCE($1, is_vacant),
                maintenance_status = COALESCE($2, maintenance_status),
                housekeeping_status = COALESCE($3, housekeeping_status)
            WHERE room_number = $4
            RETURNING *
        `;
        
        const result = await pool.query(query, [
            isVacant, 
            maintenanceStatus, 
            housekeepingStatus, 
            roomNumber
        ]);

        if (result.rows.length === 0) {
            // Si la habitación no existe, la creamos
            const insertQuery = `
                INSERT INTO rooms (room_number, is_vacant, maintenance_status, housekeeping_status)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            const insertResult = await pool.query(insertQuery, [
                roomNumber,
                isVacant || false,
                maintenanceStatus || 'ready',
                housekeepingStatus || 'clean'
            ]);
            res.json(insertResult.rows[0]);
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});
// ... existing imports and setup ...

// Tipos de permisos
const PERMISSIONS = {
    HOUSEKEEPING: 'housekeeping',
    MAINTENANCE: 'maintenance',
    VACANCY: 'vacancy'
};

const ROLES = {
    ADMIN: 'admin',
    SUPERVISOR: 'supervisor',
    WORKER: 'worker'
};

async function initializeDatabase() {
    try {
        // Crear tabla si no existe
        await pool.query(`
            CREATE TABLE IF NOT EXISTS rooms (
                room_number VARCHAR(10) PRIMARY KEY,
                is_vacant BOOLEAN DEFAULT false,
                maintenance_status VARCHAR(20) DEFAULT 'ready',
                housekeeping_status VARCHAR(20) DEFAULT 'clean'
            )
        `);

        // Verificar si hay habitaciones
        const roomCount = await pool.query('SELECT COUNT(*) FROM rooms');
        
        // Si no hay habitaciones, insertar algunas de ejemplo
        if (roomCount.rows[0].count === '0') {
            for (let i = 101; i <= 110; i++) {
                await pool.query(
                    'INSERT INTO rooms (room_number, is_vacant, maintenance_status, housekeeping_status) VALUES ($1, $2, $3, $4)',
                    [i.toString(), false, 'ready', 'clean']
                );
            }
        }
        console.log('Base de datos inicializada correctamente');

        // Crear tabla de empleados
        await pool.query(`
            CREATE TABLE IF NOT EXISTS employees (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                access_code VARCHAR(50) NOT NULL,
                role VARCHAR(20) NOT NULL,
                permissions TEXT[] NOT NULL
            )
        `);

        // Crear tabla de rooms (modificada para tracking)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS rooms (
                room_number VARCHAR(10) PRIMARY KEY,
                is_vacant BOOLEAN DEFAULT false,
                maintenance_status VARCHAR(20) DEFAULT 'ready',
                housekeeping_status VARCHAR(20) DEFAULT 'ready',
                last_updated_by INTEGER REFERENCES employees(id),
                last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Insertar admin por defecto si no existe
        const adminExists = await pool.query(
            'SELECT * FROM employees WHERE email = $1',
            ['admin@hotel.com']
        );

        if (adminExists.rows.length === 0) {
            await pool.query(`
                INSERT INTO employees (
                    first_name, last_name, email, access_code, role, permissions
                ) VALUES (
                    'Admin', 'User', 'admin@hotel.com', '1234', 'admin', 
                    ARRAY['housekeeping', 'maintenance', 'vacancy']
                )
            `);
        }

        // Crear tabla de historial
        await pool.query(`
            CREATE TABLE IF NOT EXISTS room_history (
                id SERIAL PRIMARY KEY,
                room_number VARCHAR(10) REFERENCES rooms(room_number),
                employee_id INTEGER REFERENCES employees(id),
                change_type VARCHAR(20) NOT NULL,
                old_value VARCHAR(50),
                new_value VARCHAR(50),
                changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Base de datos inicializada correctamente');
    } catch (error) {
        console.error('Error inicializando la base de datos:', error);
    }
}

// Nuevas rutas para manejo de empleados
app.post('/api/auth/login', async (req, res) => {
    const { email, accessCode } = req.body;
    try {
        const result = await pool.query(
            'SELECT id, first_name, last_name, role, permissions FROM employees WHERE email = $1 AND access_code = $2',
            [email, accessCode]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/employees', async (req, res) => {
    const { firstName, lastName, email, accessCode, role, permissions } = req.body;
    
    try {
        const result = await pool.query(`
            INSERT INTO employees (first_name, last_name, email, access_code, role, permissions)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, first_name, last_name, email, role, permissions
        `, [firstName, lastName, email, accessCode, role, permissions]);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Modificar la ruta de actualización de habitaciones
app.put('/api/rooms/:roomNumber', async (req, res) => {
    const { roomNumber } = req.params;
    const { isVacant, maintenanceStatus, housekeepingStatus, employeeId } = req.body;

    try {
        // Verificar permisos del empleado
        const employee = await pool.query(
            'SELECT role, permissions FROM employees WHERE id = $1',
            [employeeId]
        );

        if (employee.rows.length === 0) {
            return res.status(401).json({ message: 'Empleado no encontrado' });
        }

        const { role, permissions } = employee.rows[0];

        // Validar permisos según el tipo de actualización
        if (isVacant !== undefined && !permissions.includes(PERMISSIONS.VACANCY)) {
            return res.status(403).json({ message: 'Sin permiso para modificar vacancy' });
        }
        if (maintenanceStatus && !permissions.includes(PERMISSIONS.MAINTENANCE)) {
            return res.status(403).json({ message: 'Sin permiso para modificar maintenance' });
        }
        if (housekeepingStatus && !permissions.includes(PERMISSIONS.HOUSEKEEPING)) {
            return res.status(403).json({ message: 'Sin permiso para modificar housekeeping' });
        }

        // Validar estados permitidos según el rol
        if (role === ROLES.WORKER && 
            (maintenanceStatus === 'ready' || housekeepingStatus === 'ready')) {
            return res.status(403).json({ message: 'Solo supervisores pueden establecer estado ready' });
        }

        // Obtener estado actual de la habitación
        const currentState = await pool.query(
            'SELECT * FROM rooms WHERE room_number = $1',
            [roomNumber]
        );

        const query = `
            UPDATE rooms 
            SET is_vacant = COALESCE($1, is_vacant),
                maintenance_status = COALESCE($2, maintenance_status),
                housekeeping_status = COALESCE($3, housekeeping_status),
                last_updated_by = $4,
                last_updated_at = CURRENT_TIMESTAMP
            WHERE room_number = $5
            RETURNING *
        `;
        
        const result = await pool.query(query, [
            isVacant, 
            maintenanceStatus, 
            housekeepingStatus, 
            employeeId,
            roomNumber
        ]);

        // Registrar cambios en el historial
        if (isVacant !== undefined && isVacant !== currentState.rows[0].is_vacant) {
            await pool.query(`
                INSERT INTO room_history (
                    room_number, employee_id, change_type, old_value, new_value
                ) VALUES ($1, $2, $3, $4, $5)
            `, [
                roomNumber,
                employeeId,
                'vacancy',
                currentState.rows[0].is_vacant.toString(),
                isVacant.toString()
            ]);
        }

        if (maintenanceStatus && maintenanceStatus !== currentState.rows[0].maintenance_status) {
            await pool.query(`
                INSERT INTO room_history (
                    room_number, employee_id, change_type, old_value, new_value
                ) VALUES ($1, $2, $3, $4, $5)
            `, [
                roomNumber,
                employeeId,
                'maintenance',
                currentState.rows[0].maintenance_status,
                maintenanceStatus
            ]);
        }

        if (housekeepingStatus && housekeepingStatus !== currentState.rows[0].housekeeping_status) {
            await pool.query(`
                INSERT INTO room_history (
                    room_number, employee_id, change_type, old_value, new_value
                ) VALUES ($1, $2, $3, $4, $5)
            `, [
                roomNumber,
                employeeId,
                'housekeeping',
                currentState.rows[0].housekeeping_status,
                housekeepingStatus
            ]);
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Agregar una ruta para consultar el historial
app.get('/api/rooms/:roomNumber/history', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                rh.*,
                e.first_name,
                e.last_name,
                e.role
            FROM room_history rh
            JOIN employees e ON e.id = rh.employee_id
            WHERE room_number = $1
            ORDER BY changed_at DESC
        `, [req.params.roomNumber]);
        
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Inicializar la base de datos y arrancar el servidor
initializeDatabase().then(() => {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}); 