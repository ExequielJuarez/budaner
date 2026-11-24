-- Estructura de la base de Budaner Automotores (MySQL 8).
-- La usa "npm run db:instalar". ATENCIÓN: borra y vuelve a crear las tablas.

CREATE DATABASE IF NOT EXISTS budaner_automotores CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE budaner_automotores;
SET time_zone = '-03:00';

DROP TABLE IF EXISTS consultas;
DROP TABLE IF EXISTS vehiculo_imagenes;
DROP TABLE IF EXISTS vehiculos;
DROP TABLE IF EXISTS ajustes;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS usuarios;

-- Administradores del panel
CREATE TABLE usuarios (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(80)  NOT NULL,
  usuario       VARCHAR(120) NOT NULL UNIQUE,     -- con esto se entra al panel
  clave         VARCHAR(100) NOT NULL,            -- hash bcrypt
  creado_en     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stock de vehículos
CREATE TABLE vehiculos (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  marca         VARCHAR(40)  NOT NULL,
  modelo        VARCHAR(80)  NOT NULL,
  anio          SMALLINT UNSIGNED NOT NULL,
  segmento      VARCHAR(40)  NOT NULL,
  condicion     ENUM('Usado Seleccionado', '0km') NOT NULL DEFAULT 'Usado Seleccionado',
  km            INT UNSIGNED NOT NULL DEFAULT 0,
  transmision   ENUM('Automática', 'Manual') NOT NULL DEFAULT 'Automática',
  combustible   ENUM('Nafta', 'Diésel', 'Híbrido', 'Eléctrico', 'GNC') NOT NULL DEFAULT 'Nafta',
  precio        INT UNSIGNED NOT NULL,
  descripcion   TEXT         NULL,
  destacado     TINYINT(1)   NOT NULL DEFAULT 0,   -- sale en el carrusel "Destacados"
  publicado     TINYINT(1)   NOT NULL DEFAULT 1,   -- 0 = oculto en la web (reservado, vendido...)
  creado_en     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vehiculos_publicado (publicado, destacado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fotos de cada vehículo (orden 0 = la principal, la de la tarjeta)
CREATE TABLE vehiculo_imagenes (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehiculo_id   INT UNSIGNED NOT NULL,
  ruta          VARCHAR(200) NOT NULL,
  orden         SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_imagen_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos (id) ON DELETE CASCADE,
  INDEX idx_imagenes_vehiculo (vehiculo_id, orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Consultas que llegan desde el botón "Consultar con asesor"
CREATE TABLE consultas (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(80)  NOT NULL,
  telefono      VARCHAR(20)  NOT NULL,
  mensaje       VARCHAR(500) NULL,
  motivo        VARCHAR(160) NOT NULL,
  vehiculo_id   INT UNSIGNED NULL,
  estado        ENUM('nueva', 'contactada', 'cerrada') NOT NULL DEFAULT 'nueva',
  creado_en     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_consulta_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos (id) ON DELETE SET NULL,
  INDEX idx_consultas_estado (estado, creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Clientes: fotos de las entregas (sección "Nuestros clientes" al final del inicio)
CREATE TABLE clientes (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(80)  NOT NULL,
  vehiculo      VARCHAR(80)  NULL,                -- ej: "Fiat Titano"
  foto          VARCHAR(200) NOT NULL,
  publicado     TINYINT(1)   NOT NULL DEFAULT 1,
  creado_en     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_clientes_publicado (publicado, creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos de la concesionaria editables desde el panel (WhatsApp, horarios, portada...)
CREATE TABLE ajustes (
  clave         VARCHAR(40)  PRIMARY KEY,
  valor         TEXT         NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
