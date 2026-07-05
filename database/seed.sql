DELETE FROM historial_transacciones;
DELETE FROM clientes;

INSERT INTO clientes (nombre, telefono, saldo_actual) VALUES
('María García',     '+5215512345601', 450.50),
('Juan Pérez',       '+5215512345602', 0.00),
('Ana López',        '+5215512345603', 1200.00),
('Carlos Martínez',  '+5215512345604', 320.75),
('Laura Hernández',  '+5215512345605', 0.00),
('Pedro Sánchez',    '+5215512345606', 890.00),
('Sofía Ramírez',    '+5215512345607', 150.25),
('Miguel Torres',    '+5215512345608', 0.00),
('Diana Flores',     '+5215512345609', 675.00),
('Roberto Cruz',     '+5215512345610', 0.00);

SELECT id, nombre, telefono, saldo_actual FROM clientes;
