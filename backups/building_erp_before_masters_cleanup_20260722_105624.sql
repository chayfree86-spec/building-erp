-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: building_erp
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `approval_histories`
--

DROP TABLE IF EXISTS `approval_histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `approval_histories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `approval_request_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `action` varchar(50) NOT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `approval_histories_approval_request_id_index` (`approval_request_id`),
  KEY `approval_histories_user_id_index` (`user_id`),
  CONSTRAINT `approval_histories_approval_request_id_foreign` FOREIGN KEY (`approval_request_id`) REFERENCES `approval_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `approval_histories_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `approval_histories`
--

LOCK TABLES `approval_histories` WRITE;
/*!40000 ALTER TABLE `approval_histories` DISABLE KEYS */;
/*!40000 ALTER TABLE `approval_histories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `approval_requests`
--

DROP TABLE IF EXISTS `approval_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `approval_requests` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `store_id` bigint(20) unsigned NOT NULL,
  `module` varchar(100) NOT NULL,
  `record_id` bigint(20) unsigned NOT NULL,
  `record_type` varchar(100) NOT NULL,
  `action` varchar(50) NOT NULL,
  `requested_by` bigint(20) unsigned NOT NULL,
  `request_note` text DEFAULT NULL,
  `status` enum('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
  `approved_by` bigint(20) unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `approval_note` text DEFAULT NULL,
  `rejected_by` bigint(20) unsigned DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `approval_requests_approved_by_foreign` (`approved_by`),
  KEY `approval_requests_rejected_by_foreign` (`rejected_by`),
  KEY `approval_requests_store_id_index` (`store_id`),
  KEY `approval_requests_module_record_id_index` (`module`,`record_id`),
  KEY `approval_requests_status_index` (`status`),
  KEY `approval_requests_requested_by_index` (`requested_by`),
  CONSTRAINT `approval_requests_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `approval_requests_rejected_by_foreign` FOREIGN KEY (`rejected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `approval_requests_requested_by_foreign` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`),
  CONSTRAINT `approval_requests_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `approval_requests`
--

LOCK TABLES `approval_requests` WRITE;
/*!40000 ALTER TABLE `approval_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `approval_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `store_id` bigint(20) unsigned DEFAULT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `module` varchar(100) NOT NULL,
  `action` varchar(100) NOT NULL,
  `record_type` varchar(100) DEFAULT NULL,
  `record_id` bigint(20) unsigned DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `request_id` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `audit_logs_store_id_index` (`store_id`),
  KEY `audit_logs_user_id_index` (`user_id`),
  KEY `audit_logs_module_index` (`module`),
  KEY `audit_logs_action_index` (`action`),
  KEY `audit_logs_record_type_record_id_index` (`record_type`,`record_id`),
  KEY `audit_logs_created_at_index` (`created_at`),
  CONSTRAINT `audit_logs_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE SET NULL,
  CONSTRAINT `audit_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `batch_price_histories`
--

DROP TABLE IF EXISTS `batch_price_histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `batch_price_histories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `batch_id` bigint(20) unsigned NOT NULL,
  `old_price` decimal(15,2) NOT NULL,
  `new_price` decimal(15,2) NOT NULL,
  `effective_from` date NOT NULL,
  `reason` varchar(200) DEFAULT NULL,
  `approved_by` bigint(20) unsigned DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `batch_price_histories_approved_by_foreign` (`approved_by`),
  KEY `batch_price_histories_created_by_foreign` (`created_by`),
  KEY `batch_price_histories_batch_id_index` (`batch_id`),
  KEY `batch_price_histories_effective_from_index` (`effective_from`),
  CONSTRAINT `batch_price_histories_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `batch_price_histories_batch_id_foreign` FOREIGN KEY (`batch_id`) REFERENCES `purchase_batches` (`id`),
  CONSTRAINT `batch_price_histories_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `batch_price_histories`
--

LOCK TABLES `batch_price_histories` WRITE;
/*!40000 ALTER TABLE `batch_price_histories` DISABLE KEYS */;
/*!40000 ALTER TABLE `batch_price_histories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `brands`
--

DROP TABLE IF EXISTS `brands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `brands` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `brands_created_by_foreign` (`created_by`),
  KEY `brands_status_index` (`status`),
  CONSTRAINT `brands_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `brands`
--

LOCK TABLES `brands` WRITE;
/*!40000 ALTER TABLE `brands` DISABLE KEYS */;
INSERT INTO `brands` VALUES (1,'UltraTech Cement','Indias largest cement manufacturer','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(2,'ACC Cement','ACC Limited - trusted cement brand','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(3,'Birla Shakti','Birla Shakti cement','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(4,'Tata Tiscon','Tata Steel TMT bars','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(5,'JSW Steel','JSW Neosteel TMT bars','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(6,'Asian Paints','Paints, primers, putty, waterproofing','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(7,'Berger Paints','Exterior & interior paints','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(8,'Supreme Pipes','PVC, CPVC, UPVC pipes & fittings','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(9,'Finolex','Electrical wires, cables, pipes','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(10,'Hindware','Sanitaryware & plumbing solutions','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(11,'Kajaria','Ceramic & vitrified tiles','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(12,'Somany','Tiles, sanitaryware, bath fittings','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(13,'CenturyPly','Plywood, laminates, MDF, blockboards','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(14,'Greenply','Plywood, veneers, flush doors','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(15,'Godrej','Locks, hardware, furniture fittings','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(16,'Everest','Roofing sheets & building solutions','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(17,'Dr. Fixit','Waterproofing & construction chemicals','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(18,'Sika','Adhesives, sealants, waterproofing','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(19,'Apollo Pipes','PVC, CPVC, HDPE pipes','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(20,'Anchor','Electrical switches, MCBs, accessories','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL);
/*!40000 ALTER TABLE `brands` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `unit_id` bigint(20) unsigned DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `categories_unit_id_foreign` (`unit_id`),
  KEY `categories_created_by_foreign` (`created_by`),
  KEY `categories_status_index` (`status`),
  CONSTRAINT `categories_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `categories_unit_id_foreign` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Cement',2,'Cement bags (PPC, OPC, PSC)','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(2,'Steel / TMT Bars',4,'TMT bars, rebars, and structural steel','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(3,'Bricks & Blocks',1,'Clay bricks, fly-ash bricks, AAC blocks','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(4,'Sand & Aggregates',8,'River sand, M-sand, 10mm/20mm aggregates','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(5,'Pipes & Fittings',5,'PVC, CPVC, GI pipes and fittings','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(6,'Paints & Coatings',10,'Interior, exterior paints, primers, putty','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(7,'Plywood & Boards',7,'Plywood sheets, MDF, particle boards','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(8,'Tiles & Marbles',7,'Ceramic tiles, vitrified, marble, granite','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(9,'Electrical',1,'Wires, switches, MCBs, distribution boards','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(10,'Plumbing',1,'Sanitaryware, faucets, cisterns','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(11,'Hardware',1,'Nails, screws, bolts, hinges, locks','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(12,'Doors & Windows',1,'Wooden doors, UPVC windows, frames','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(13,'Roofing Sheets',6,'GI sheets, polycarbonate, asbestos sheets','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(14,'Adhesives',3,'Tile adhesive, white cement, epoxy','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(15,'Waterproofing',3,'Waterproofing compounds and membranes','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(16,'Services & Charges',1,'Transportation, labor, and other service charges (does not track inventory stock)','active',NULL,'2026-07-18 12:37:55','2026-07-18 12:37:55',NULL);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category_brands`
--

DROP TABLE IF EXISTS `category_brands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `category_brands` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `category_id` bigint(20) unsigned NOT NULL,
  `brand_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `category_brands_category_id_brand_id_unique` (`category_id`,`brand_id`),
  KEY `category_brands_brand_id_foreign` (`brand_id`),
  CONSTRAINT `category_brands_brand_id_foreign` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON DELETE CASCADE,
  CONSTRAINT `category_brands_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category_brands`
--

LOCK TABLES `category_brands` WRITE;
/*!40000 ALTER TABLE `category_brands` DISABLE KEYS */;
INSERT INTO `category_brands` VALUES (1,1,1,NULL,NULL),(2,1,2,NULL,NULL);
/*!40000 ALTER TABLE `category_brands` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category_supplier`
--

DROP TABLE IF EXISTS `category_supplier`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `category_supplier` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `category_id` bigint(20) unsigned NOT NULL,
  `supplier_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `category_supplier_category_id_supplier_id_unique` (`category_id`,`supplier_id`),
  KEY `category_supplier_supplier_id_foreign` (`supplier_id`),
  CONSTRAINT `category_supplier_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `category_supplier_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category_supplier`
--

LOCK TABLES `category_supplier` WRITE;
/*!40000 ALTER TABLE `category_supplier` DISABLE KEYS */;
/*!40000 ALTER TABLE `category_supplier` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category_units`
--

DROP TABLE IF EXISTS `category_units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `category_units` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `category_id` bigint(20) unsigned NOT NULL,
  `unit_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `category_units_category_id_unit_id_unique` (`category_id`,`unit_id`),
  KEY `category_units_unit_id_foreign` (`unit_id`),
  CONSTRAINT `category_units_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `category_units_unit_id_foreign` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category_units`
--

LOCK TABLES `category_units` WRITE;
/*!40000 ALTER TABLE `category_units` DISABLE KEYS */;
INSERT INTO `category_units` VALUES (1,1,1,NULL,NULL),(2,1,2,NULL,NULL);
/*!40000 ALTER TABLE `category_units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_addresses`
--

DROP TABLE IF EXISTS `customer_addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customer_addresses` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` bigint(20) unsigned NOT NULL,
  `address_type` varchar(50) NOT NULL DEFAULT 'billing',
  `address` text NOT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `customer_addresses_customer_id_index` (`customer_id`),
  KEY `customer_addresses_address_type_index` (`address_type`),
  CONSTRAINT `customer_addresses_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_addresses`
--

LOCK TABLES `customer_addresses` WRITE;
/*!40000 ALTER TABLE `customer_addresses` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_ledgers`
--

DROP TABLE IF EXISTS `customer_ledgers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customer_ledgers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `store_id` bigint(20) unsigned NOT NULL,
  `customer_id` bigint(20) unsigned NOT NULL,
  `transaction_type` varchar(50) NOT NULL,
  `transaction_id` bigint(20) unsigned DEFAULT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `transaction_date` date NOT NULL,
  `debit_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `credit_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `running_balance` decimal(15,2) NOT NULL DEFAULT 0.00,
  `remarks` text DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `customer_ledgers_created_by_foreign` (`created_by`),
  KEY `customer_ledgers_store_id_index` (`store_id`),
  KEY `customer_ledgers_customer_id_index` (`customer_id`),
  KEY `customer_ledgers_transaction_type_index` (`transaction_type`),
  KEY `customer_ledgers_transaction_date_index` (`transaction_date`),
  KEY `customer_ledgers_store_id_customer_id_transaction_date_index` (`store_id`,`customer_id`,`transaction_date`),
  KEY `customer_ledgers_transaction_type_transaction_id_index` (`transaction_type`,`transaction_id`),
  CONSTRAINT `customer_ledgers_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `customer_ledgers_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `customer_ledgers_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_ledgers`
--

LOCK TABLES `customer_ledgers` WRITE;
/*!40000 ALTER TABLE `customer_ledgers` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_ledgers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_payment_allocations`
--

DROP TABLE IF EXISTS `customer_payment_allocations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customer_payment_allocations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `payment_id` bigint(20) unsigned NOT NULL,
  `invoice_id` bigint(20) unsigned NOT NULL,
  `allocated_amount` decimal(15,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_payment_allocations_payment_id_invoice_id_unique` (`payment_id`,`invoice_id`),
  KEY `customer_payment_allocations_payment_id_index` (`payment_id`),
  KEY `customer_payment_allocations_invoice_id_index` (`invoice_id`),
  CONSTRAINT `customer_payment_allocations_invoice_id_foreign` FOREIGN KEY (`invoice_id`) REFERENCES `sales_invoices` (`id`),
  CONSTRAINT `customer_payment_allocations_payment_id_foreign` FOREIGN KEY (`payment_id`) REFERENCES `customer_payments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_payment_allocations`
--

LOCK TABLES `customer_payment_allocations` WRITE;
/*!40000 ALTER TABLE `customer_payment_allocations` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_payment_allocations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_payments`
--

DROP TABLE IF EXISTS `customer_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customer_payments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `store_id` bigint(20) unsigned NOT NULL,
  `customer_id` bigint(20) unsigned NOT NULL,
  `receipt_number` varchar(100) NOT NULL,
  `payment_date` date NOT NULL,
  `payment_mode_id` bigint(20) unsigned DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `allocated_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `advance_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `transaction_reference` varchar(200) DEFAULT NULL,
  `status` enum('draft','confirmed','cancelled','returned') NOT NULL DEFAULT 'draft',
  `remarks` text DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `cancelled_by` bigint(20) unsigned DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_payments_receipt_number_unique` (`receipt_number`),
  KEY `customer_payments_payment_mode_id_foreign` (`payment_mode_id`),
  KEY `customer_payments_created_by_foreign` (`created_by`),
  KEY `customer_payments_cancelled_by_foreign` (`cancelled_by`),
  KEY `customer_payments_store_id_index` (`store_id`),
  KEY `customer_payments_customer_id_index` (`customer_id`),
  KEY `customer_payments_payment_date_index` (`payment_date`),
  KEY `customer_payments_status_index` (`status`),
  KEY `customer_payments_store_id_customer_id_payment_date_index` (`store_id`,`customer_id`,`payment_date`),
  CONSTRAINT `customer_payments_cancelled_by_foreign` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `customer_payments_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `customer_payments_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `customer_payments_payment_mode_id_foreign` FOREIGN KEY (`payment_mode_id`) REFERENCES `payment_modes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `customer_payments_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_payments`
--

LOCK TABLES `customer_payments` WRITE;
/*!40000 ALTER TABLE `customer_payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(300) NOT NULL,
  `mobile` varchar(15) DEFAULT NULL,
  `normalized_mobile` varchar(15) DEFAULT NULL,
  `alternate_mobile` varchar(15) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `gst_number` varchar(20) DEFAULT NULL,
  `opening_balance` decimal(15,2) NOT NULL DEFAULT 0.00,
  `opening_balance_type` enum('debit','credit') NOT NULL DEFAULT 'debit',
  `credit_limit` decimal(15,2) NOT NULL DEFAULT 0.00,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `updated_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customers_normalized_mobile_unique` (`normalized_mobile`),
  KEY `customers_created_by_foreign` (`created_by`),
  KEY `customers_updated_by_foreign` (`updated_by`),
  KEY `customers_normalized_mobile_index` (`normalized_mobile`),
  KEY `customers_status_index` (`status`),
  KEY `customers_gst_number_index` (`gst_number`),
  CONSTRAINT `customers_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `customers_updated_by_foreign` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `financial_years`
--

DROP TABLE IF EXISTS `financial_years`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `financial_years` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 0,
  `is_closed` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `financial_years_start_date_end_date_unique` (`start_date`,`end_date`),
  KEY `financial_years_is_active_index` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `financial_years`
--

LOCK TABLES `financial_years` WRITE;
/*!40000 ALTER TABLE `financial_years` DISABLE KEYS */;
INSERT INTO `financial_years` VALUES (1,'2026-27','2026-04-01','2027-03-31',1,0,'2026-07-18 11:01:35','2026-07-18 11:01:35');
/*!40000 ALTER TABLE `financial_years` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gst_rates`
--

DROP TABLE IF EXISTS `gst_rates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gst_rates` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `rate` decimal(7,4) NOT NULL,
  `cgst_rate` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `sgst_rate` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `igst_rate` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `description` text DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `gst_rates_rate_unique` (`rate`),
  KEY `gst_rates_status_index` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gst_rates`
--

LOCK TABLES `gst_rates` WRITE;
/*!40000 ALTER TABLE `gst_rates` DISABLE KEYS */;
INSERT INTO `gst_rates` VALUES (1,'GST 0%',0.0000,0.0000,0.0000,0.0000,NULL,'active','2026-07-18 11:01:32','2026-07-18 11:01:32'),(2,'GST 5%',5.0000,2.5000,2.5000,5.0000,NULL,'active','2026-07-18 11:01:32','2026-07-18 11:01:32'),(3,'GST 12%',12.0000,6.0000,6.0000,12.0000,NULL,'active','2026-07-18 11:01:32','2026-07-18 11:01:32'),(4,'GST 18%',18.0000,9.0000,9.0000,18.0000,NULL,'active','2026-07-18 11:01:32','2026-07-18 11:01:32'),(5,'GST 28%',28.0000,14.0000,14.0000,28.0000,NULL,'active','2026-07-18 11:01:32','2026-07-18 11:01:32');
/*!40000 ALTER TABLE `gst_rates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_ledgers`
--

DROP TABLE IF EXISTS `inventory_ledgers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inventory_ledgers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `store_id` bigint(20) unsigned NOT NULL,
  `product_id` bigint(20) unsigned NOT NULL,
  `batch_id` bigint(20) unsigned NOT NULL,
  `transaction_type` varchar(50) NOT NULL,
  `transaction_id` bigint(20) unsigned DEFAULT NULL,
  `transaction_item_id` bigint(20) unsigned DEFAULT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `transaction_date` date NOT NULL,
  `opening_quantity` decimal(15,3) NOT NULL DEFAULT 0.000,
  `incoming_quantity` decimal(15,3) NOT NULL DEFAULT 0.000,
  `outgoing_quantity` decimal(15,3) NOT NULL DEFAULT 0.000,
  `closing_quantity` decimal(15,3) NOT NULL DEFAULT 0.000,
  `unit_id` bigint(20) unsigned DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `inventory_ledgers_unit_id_foreign` (`unit_id`),
  KEY `inventory_ledgers_created_by_foreign` (`created_by`),
  KEY `inventory_ledgers_store_id_index` (`store_id`),
  KEY `inventory_ledgers_product_id_index` (`product_id`),
  KEY `inventory_ledgers_batch_id_index` (`batch_id`),
  KEY `inventory_ledgers_transaction_type_index` (`transaction_type`),
  KEY `inventory_ledgers_transaction_date_index` (`transaction_date`),
  KEY `inventory_ledgers_store_id_product_id_batch_id_index` (`store_id`,`product_id`,`batch_id`),
  KEY `inventory_ledgers_store_id_product_id_transaction_date_index` (`store_id`,`product_id`,`transaction_date`),
  KEY `inventory_ledgers_transaction_type_transaction_id_index` (`transaction_type`,`transaction_id`),
  CONSTRAINT `inventory_ledgers_batch_id_foreign` FOREIGN KEY (`batch_id`) REFERENCES `purchase_batches` (`id`),
  CONSTRAINT `inventory_ledgers_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `inventory_ledgers_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `inventory_ledgers_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`),
  CONSTRAINT `inventory_ledgers_unit_id_foreign` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_ledgers`
--

LOCK TABLES `inventory_ledgers` WRITE;
/*!40000 ALTER TABLE `inventory_ledgers` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_ledgers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `login_logs`
--

DROP TABLE IF EXISTS `login_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `login_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `mobile` varchar(15) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `status` enum('success','failed') NOT NULL,
  `failure_reason` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `login_logs_user_id_index` (`user_id`),
  KEY `login_logs_email_index` (`email`),
  KEY `login_logs_status_index` (`status`),
  KEY `login_logs_created_at_index` (`created_at`),
  CONSTRAINT `login_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `login_logs`
--

LOCK TABLES `login_logs` WRITE;
/*!40000 ALTER TABLE `login_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `login_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'2024_01_01_000001_create_stores_table',1),(2,'2024_01_01_000002_create_users_table',1),(3,'2024_01_01_000003_create_store_users_table',1),(4,'2024_01_01_000004_create_roles_table',1),(5,'2024_01_01_000005_create_permissions_table',1),(6,'2024_01_01_000006_create_role_permissions_table',1),(7,'2024_01_01_000007_create_user_roles_table',1),(8,'2024_01_01_000008_create_units_table',1),(9,'2024_01_01_000009_create_categories_table',1),(10,'2024_01_01_000010_create_brands_table',1),(11,'2024_01_01_000011_create_gst_rates_table',1),(12,'2024_01_01_000012_create_products_table',1),(13,'2024_01_01_000013_create_product_barcodes_table',1),(14,'2024_01_01_000014_create_customers_table',1),(15,'2024_01_01_000015_create_customer_addresses_table',1),(16,'2024_01_01_000016_create_suppliers_table',1),(17,'2024_01_01_000017_create_supplier_addresses_table',1),(18,'2024_01_01_000018_create_payment_modes_table',1),(19,'2024_01_01_000019_create_financial_years_table',1),(20,'2024_01_01_000020_create_number_series_table',1),(21,'2024_01_01_000021_create_purchases_table',1),(22,'2024_01_01_000022_create_purchase_items_table',1),(23,'2024_01_01_000023_create_purchase_batches_table',1),(24,'2024_01_01_000024_create_purchase_returns_table',1),(25,'2024_01_01_000025_create_purchase_return_items_table',1),(26,'2024_01_01_000026_create_sales_invoices_table',1),(27,'2024_01_01_000027_create_sales_invoice_items_table',1),(28,'2024_01_01_000028_create_sales_batch_allocations_table',1),(29,'2024_01_01_000029_create_sales_returns_table',1),(30,'2024_01_01_000030_create_sales_return_items_table',1),(31,'2024_01_01_000031_create_sales_return_batch_allocations_table',1),(32,'2024_01_01_000032_create_customer_payments_table',1),(33,'2024_01_01_000033_create_customer_payment_allocations_table',1),(34,'2024_01_01_000034_create_supplier_payments_table',1),(35,'2024_01_01_000035_create_supplier_payment_allocations_table',1),(36,'2024_01_01_000036_create_inventory_ledgers_table',1),(37,'2024_01_01_000037_create_customer_ledgers_table',1),(38,'2024_01_01_000038_create_supplier_ledgers_table',1),(39,'2024_01_01_000039_create_stock_adjustments_table',1),(40,'2024_01_01_000040_create_stock_adjustment_items_table',1),(41,'2024_01_01_000041_create_stock_transfers_table',1),(42,'2024_01_01_000042_create_stock_transfer_items_table',1),(43,'2024_01_01_000043_create_stock_transfer_batch_allocations_table',1),(44,'2024_01_01_000044_create_approval_requests_table',1),(45,'2024_01_01_000045_create_approval_histories_table',1),(46,'2024_01_01_000046_create_audit_logs_table',1),(47,'2024_01_01_000047_create_login_logs_table',1),(48,'2024_01_01_000048_create_settings_table',1),(49,'2024_01_01_000049_create_batch_price_histories_table',1),(50,'2024_01_01_000050_add_foreign_keys_to_stores_table',1),(51,'2024_01_01_000051_add_bill_attachment_to_purchases_table',1),(52,'2026_07_15_192414_create_personal_access_tokens_table',1),(53,'2026_07_18_000001_fix_stock_adjustments_type_enum',1),(54,'2026_07_18_000002_make_return_item_fk_nullable',1),(55,'2026_07_18_121248_add_category_id_to_suppliers_table',1),(56,'2026_07_18_125036_create_category_units_table',1),(57,'2026_07_18_131709_create_category_brands_table',1),(58,'2026_07_18_133249_create_product_brands_table',1),(59,'2026_07_18_174000_create_category_supplier_table',2),(60,'2026_07_18_181000_seed_services_and_charges',3),(61,'2026_07_18_223800_add_pin_to_users_table',4);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `number_series`
--

DROP TABLE IF EXISTS `number_series`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `number_series` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `store_id` bigint(20) unsigned NOT NULL,
  `document_type` varchar(50) NOT NULL,
  `financial_year_id` bigint(20) unsigned DEFAULT NULL,
  `prefix` varchar(50) DEFAULT NULL,
  `current_number` bigint(20) unsigned NOT NULL DEFAULT 1,
  `padding_length` tinyint(3) unsigned NOT NULL DEFAULT 6,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `number_series_store_id_document_type_financial_year_id_unique` (`store_id`,`document_type`,`financial_year_id`),
  KEY `number_series_financial_year_id_foreign` (`financial_year_id`),
  KEY `number_series_document_type_index` (`document_type`),
  CONSTRAINT `number_series_financial_year_id_foreign` FOREIGN KEY (`financial_year_id`) REFERENCES `financial_years` (`id`) ON DELETE SET NULL,
  CONSTRAINT `number_series_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `number_series`
--

LOCK TABLES `number_series` WRITE;
/*!40000 ALTER TABLE `number_series` DISABLE KEYS */;
INSERT INTO `number_series` VALUES (1,1,'invoice',1,'INV',1,4,'2026-07-18 11:01:36','2026-07-18 11:01:36'),(2,1,'purchase',1,'PUR',3,4,'2026-07-18 11:01:36','2026-07-18 11:57:25'),(3,1,'customer_payment',1,'RCPT',3,4,'2026-07-18 11:01:36','2026-07-18 12:27:55'),(4,1,'supplier_payment',1,'PAY',2,4,'2026-07-18 11:01:36','2026-07-18 11:52:18'),(5,1,'sales_return',1,'SR',1,4,'2026-07-18 11:01:36','2026-07-18 11:01:36'),(6,1,'purchase_return',1,'PR',1,4,'2026-07-18 11:01:36','2026-07-18 11:01:36'),(7,1,'stock_adjustment',1,'ADJ',1,4,'2026-07-18 11:01:36','2026-07-18 11:01:36'),(8,1,'stock_transfer',1,'TRF',1,4,'2026-07-18 11:01:36','2026-07-18 11:01:36'),(9,1,'credit_note',1,'CN',1,4,'2026-07-18 11:01:36','2026-07-18 11:01:36'),(10,1,'debit_note',1,'DN',1,4,'2026-07-18 11:01:36','2026-07-18 11:01:36'),(11,1,'sales_invoice',1,'INV',5,6,'2026-07-18 12:17:01','2026-07-18 15:51:09');
/*!40000 ALTER TABLE `number_series` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_modes`
--

DROP TABLE IF EXISTS `payment_modes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_modes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_modes_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_modes`
--

LOCK TABLES `payment_modes` WRITE;
/*!40000 ALTER TABLE `payment_modes` DISABLE KEYS */;
INSERT INTO `payment_modes` VALUES (1,'Cash','cash',1,'2026-07-18 11:01:32','2026-07-18 11:01:32'),(2,'UPI','upi',1,'2026-07-18 11:01:32','2026-07-18 11:01:32'),(3,'Card','card',1,'2026-07-18 11:01:32','2026-07-18 11:01:32'),(4,'Bank Transfer','bank_transfer',1,'2026-07-18 11:01:32','2026-07-18 11:01:32'),(5,'Cheque','cheque',1,'2026-07-18 11:01:32','2026-07-18 11:01:32'),(6,'Credit','credit',1,'2026-07-18 11:01:32','2026-07-18 11:01:32'),(7,'Adjustment','adjustment',1,'2026-07-18 11:01:32','2026-07-18 11:01:32');
/*!40000 ALTER TABLE `payment_modes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permissions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `slug` varchar(200) NOT NULL,
  `module` varchar(100) DEFAULT NULL,
  `action` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_slug_unique` (`slug`),
  KEY `permissions_module_index` (`module`),
  KEY `permissions_action_index` (`action`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'View Users','view_users','users','view',NULL,'2026-07-18 11:01:32','2026-07-18 11:01:32'),(2,'Add User','add_user','users','add',NULL,'2026-07-18 11:01:32','2026-07-18 11:01:32'),(3,'Edit User','edit_user','users','edit',NULL,'2026-07-18 11:01:32','2026-07-18 11:01:32'),(4,'Delete User','delete_user','users','delete',NULL,'2026-07-18 11:01:32','2026-07-18 11:01:32'),(5,'View Stores','view_stores','stores','view',NULL,'2026-07-18 11:01:32','2026-07-18 11:01:32'),(6,'Manage Stores','manage_stores','stores','edit',NULL,'2026-07-18 11:01:32','2026-07-18 11:01:32'),(7,'View Products','view_products','products','view',NULL,'2026-07-18 11:01:32','2026-07-18 11:01:32'),(8,'Add Product','add_product','products','add',NULL,'2026-07-18 11:01:32','2026-07-18 11:01:32'),(9,'Edit Product','edit_product','products','edit',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(10,'Delete Product','delete_product','products','delete',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(11,'View Customers','view_customers','customers','view',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(12,'Add Customer','add_customer','customers','add',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(13,'Edit Customer','edit_customer','customers','edit',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(14,'View Suppliers','view_suppliers','suppliers','view',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(15,'Add Supplier','add_supplier','suppliers','add',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(16,'Edit Supplier','edit_supplier','suppliers','edit',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(17,'View Purchases','view_purchases','purchases','view',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(18,'Add Purchase','add_purchase','purchases','add',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(19,'Edit Purchase','edit_purchase','purchases','edit',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(20,'Approve Purchase','approve_purchase','purchases','approve',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(21,'Cancel Purchase','cancel_purchase','purchases','cancel',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(22,'View Invoices','view_invoices','invoices','view',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(23,'Add Invoice','add_invoice','invoices','add',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(24,'Edit Invoice','edit_invoice','invoices','edit',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(25,'Cancel Invoice','cancel_invoice','invoices','cancel',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(26,'Reverse Invoice','reverse_invoice','invoices','reverse',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(27,'View Payments','view_payments','payments','view',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(28,'Add Payment','add_payment','payments','add',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(29,'Reverse Payment','reverse_payment','payments','reverse',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(30,'View Returns','view_returns','returns','view',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(31,'Add Return','add_return','returns','add',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(32,'Cancel Return','cancel_return','returns','cancel',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(33,'View Stock','view_stock','stock','view',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(34,'Stock Adjustment','stock_adjustment','stock','stock_adjustment',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(35,'Stock Transfer','stock_transfer','stock','add',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(36,'View Reports','view_reports','reports','view',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(37,'Export Reports','export_reports','reports','export',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(38,'View Cost Price','view_cost','sensitive','view_cost',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(39,'View Profit','view_profit','sensitive','view_profit',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(40,'Price Override','price_override','sensitive','price_override',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(41,'Discount Override','discount_override','sensitive','discount_override',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(42,'Backdated Entry','backdated_entry','sensitive','backdated_entry',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(43,'View Audit Logs','view_audit_logs','audit','view',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(44,'Manage Settings','manage_settings','settings','edit',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(45,'Manage Roles','manage_roles','roles','edit',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(46,'Print Documents','print','documents','print',NULL,'2026-07-18 11:01:33','2026-07-18 11:01:33');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) unsigned NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
INSERT INTO `personal_access_tokens` VALUES (1,'App\\Models\\User',1,'api-token','5b62b11482bf3791c8ce99402703491417180dda7d75c025a8d6910852a2c216','[\"*\"]','2026-07-18 13:56:30',NULL,'2026-07-18 11:41:17','2026-07-18 13:56:30'),(2,'App\\Models\\User',1,'api-token','99eeadb989b1f6c6f92fd98bb2bdea4de13f5c83c682129085a622b7fece1ebd','[\"*\"]','2026-07-18 13:17:38',NULL,'2026-07-18 13:17:38','2026-07-18 13:17:38'),(3,'App\\Models\\User',1,'api-token','cee7edc0381a13b168b7430d5322da7b680eba4cbd8c6ef440b76fafc1f5489d','[\"*\"]','2026-07-18 13:18:03',NULL,'2026-07-18 13:18:02','2026-07-18 13:18:03'),(4,'App\\Models\\User',1,'api-token','f162d7163e122f8895309eecbc75f7a46a6d165a7d4360c939f621fe72b83af6','[\"*\"]','2026-07-18 16:17:47',NULL,'2026-07-18 13:22:31','2026-07-18 16:17:47'),(5,'App\\Models\\User',1,'api-token','4db4be010df2b26bb0c4ab1bafafb61ba5dadf3a5b8025e87dc280e6c339496f','[\"*\"]','2026-07-18 13:40:09',NULL,'2026-07-18 13:40:09','2026-07-18 13:40:09'),(6,'App\\Models\\User',1,'api-token','65afe95a33f4dfe3fe62d5ceb711f596eba2f7a66a2ada9d4d5fae9ba7488528','[\"*\"]','2026-07-18 13:45:59',NULL,'2026-07-18 13:45:58','2026-07-18 13:45:59'),(7,'App\\Models\\User',1,'api-token','3d27e87e27415cd0fda98fb0f09beb2123b5088692c43e6ab2448aeaa5f1e7f8','[\"*\"]','2026-07-18 13:51:33',NULL,'2026-07-18 13:51:33','2026-07-18 13:51:33'),(10,'App\\Models\\User',1,'api-token','eb6516e10e52167b706dff185015d04da70acf37826228c3164e1802226e99e0','[\"*\"]','2026-07-18 17:18:58',NULL,'2026-07-18 17:18:22','2026-07-18 17:18:58'),(11,'App\\Models\\User',1,'api-token','121b3fee14d66ecd824229d06071a8a7ecc673c674fcc526e85652051f742579','[\"*\"]',NULL,NULL,'2026-07-22 05:07:08','2026-07-22 05:07:08'),(12,'App\\Models\\User',1,'api-token','f0d0a1126dc16db5ab4ceffd81dc46ad9f8983759ea6433a7d915df942649326','[\"*\"]','2026-07-22 05:23:18',NULL,'2026-07-22 05:09:18','2026-07-22 05:23:18');
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_barcodes`
--

DROP TABLE IF EXISTS `product_barcodes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product_barcodes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint(20) unsigned NOT NULL,
  `barcode` varchar(100) NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_barcodes_barcode_unique` (`barcode`),
  KEY `product_barcodes_product_id_index` (`product_id`),
  CONSTRAINT `product_barcodes_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_barcodes`
--

LOCK TABLES `product_barcodes` WRITE;
/*!40000 ALTER TABLE `product_barcodes` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_barcodes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_brands`
--

DROP TABLE IF EXISTS `product_brands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product_brands` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint(20) unsigned NOT NULL,
  `brand_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_brands_product_id_brand_id_unique` (`product_id`,`brand_id`),
  KEY `product_brands_brand_id_foreign` (`brand_id`),
  CONSTRAINT `product_brands_brand_id_foreign` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_brands_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_brands`
--

LOCK TABLES `product_brands` WRITE;
/*!40000 ALTER TABLE `product_brands` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_brands` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `products` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `category_id` bigint(20) unsigned DEFAULT NULL,
  `unit_id` bigint(20) unsigned DEFAULT NULL,
  `brand_id` bigint(20) unsigned DEFAULT NULL,
  `gst_rate_id` bigint(20) unsigned DEFAULT NULL,
  `name` varchar(300) NOT NULL,
  `sku` varchar(100) DEFAULT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `hsn_code` varchar(20) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `minimum_stock` decimal(15,3) NOT NULL DEFAULT 0.000,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `updated_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_sku_unique` (`sku`),
  UNIQUE KEY `products_barcode_unique` (`barcode`),
  KEY `products_unit_id_foreign` (`unit_id`),
  KEY `products_brand_id_foreign` (`brand_id`),
  KEY `products_gst_rate_id_foreign` (`gst_rate_id`),
  KEY `products_created_by_foreign` (`created_by`),
  KEY `products_updated_by_foreign` (`updated_by`),
  KEY `products_category_id_index` (`category_id`),
  KEY `products_status_index` (`status`),
  KEY `products_sku_index` (`sku`),
  KEY `products_barcode_index` (`barcode`),
  KEY `products_hsn_code_index` (`hsn_code`),
  CONSTRAINT `products_brand_id_foreign` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_gst_rate_id_foreign` FOREIGN KEY (`gst_rate_id`) REFERENCES `gst_rates` (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_unit_id_foreign` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_updated_by_foreign` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,1,2,1,5,'UltraTech PPC Cement 50kg','CEM-UT-001',NULL,'252329',NULL,50.000,'active',1,NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(2,1,2,2,5,'ACC F2R Superfast Cement 50kg','CEM-AC-002',NULL,'252329',NULL,30.000,'active',1,NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(3,1,2,3,5,'Birla Shakti OPC 53 Grade 50kg','CEM-BS-003',NULL,'252329',NULL,40.000,'active',1,NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(4,2,4,4,4,'Tata Tiscon 500D TMT Bar 12mm','STL-TT-001',NULL,'721420',NULL,1.000,'active',1,NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(5,2,4,5,4,'JSW Neosteel 550D TMT Bar 16mm','STL-JS-002',NULL,'721420',NULL,1.000,'active',1,NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(6,2,4,4,4,'Tata Tiscon 500D TMT Bar 8mm','STL-TT-003',NULL,'721420',NULL,1.000,'active',1,NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(7,3,1,NULL,2,'Red Clay Brick 9x4x3 inch','BRK-CL-001',NULL,'690100',NULL,5000.000,'active',1,NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(8,3,1,NULL,2,'Fly Ash Brick 12x6x4 inch','BRK-FA-002',NULL,'690100',NULL,3000.000,'active',1,NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(9,3,1,NULL,3,'AAC Block 600x200x100mm','BRK-AC-003',NULL,'681091',NULL,500.000,'active',1,NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(10,4,8,NULL,2,'River Sand (Coarse)','SND-RV-001',NULL,'250510',NULL,500.000,'active',1,NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(11,4,8,NULL,2,'M-Sand (Manufactured Sand)','SND-MS-002',NULL,'250510',NULL,500.000,'active',1,NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(12,4,8,NULL,2,'20mm Crushed Aggregate (Kapchi)','AGG-20-003',NULL,'251710',NULL,300.000,'active',1,NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(13,6,10,6,5,'Asian Paints Tractor Emulsion 20Ltr','PNT-AP-001',NULL,'320910',NULL,10.000,'active',1,NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(14,6,10,7,5,'Berger WeatherCoat Exterior 20Ltr','PNT-BP-002',NULL,'320910',NULL,10.000,'active',1,NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(15,6,10,6,5,'Asian Paints Royale Luxury 10Ltr','PNT-AP-003',NULL,'320910',NULL,5.000,'active',1,NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(16,5,5,8,4,'Supreme PVC Pipe 4 inch (110mm) 3Mtr','PIP-SP-001',NULL,'391723',NULL,50.000,'active',1,NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(17,5,5,9,4,'Finolex CPVC Pipe 1/2 inch (15mm) 3Mtr','PIP-FN-002',NULL,'391723',NULL,100.000,'active',1,NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(18,8,7,11,5,'Kajaria Vitrified Tile 600x600mm (4 pcs/box)','TIL-KJ-001',NULL,'690721',NULL,200.000,'active',1,NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(19,8,7,12,5,'Somany Ceramic Wall Tile 300x450mm','TIL-SM-002',NULL,'690723',NULL,100.000,'active',1,NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(20,7,7,13,4,'CenturyPly MR Grade 8x4 ft (19mm)','PLY-CP-001',NULL,'441231',NULL,20.000,'active',1,NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(21,7,7,14,4,'Greenply BWR Marine Grade 8x4 ft (19mm)','PLY-GP-002',NULL,'441231',NULL,15.000,'active',1,NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(22,9,1,9,4,'Finolex 2.5 sq mm FR PVC Wire 90Mtr (Green)','ELE-FN-001',NULL,'854449',NULL,20.000,'active',1,NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(23,9,1,20,4,'Anchor Roma 16A Switch 1-Way','ELE-AC-002',NULL,'853650',NULL,50.000,'active',1,NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35',NULL),(24,10,1,10,4,'Hindware Western WC with Flush Tank','PLM-HW-001',NULL,'691010',NULL,5.000,'active',1,NULL,'2026-07-18 11:01:36','2026-07-18 11:01:36',NULL),(25,10,1,10,4,'Hindware Wash Basin 22x16 inch','PLM-HW-002',NULL,'691010',NULL,5.000,'active',1,NULL,'2026-07-18 11:01:36','2026-07-18 11:01:36',NULL),(26,14,3,17,4,'Dr. Fixit Tile Adhesive (Grey) 20kg Bag','ADH-DF-001',NULL,'382440',NULL,15.000,'active',1,NULL,'2026-07-18 11:01:36','2026-07-18 11:01:36',NULL),(27,14,3,18,4,'Sika Ceram 250 Tile Adhesive 25kg Bag','ADH-SK-002',NULL,'382440',NULL,10.000,'active',1,NULL,'2026-07-18 11:01:36','2026-07-18 11:01:36',NULL),(28,16,1,NULL,4,'Transport Charges','SRV-TRN-001',NULL,NULL,'Delivery, transportation, and freight charges',0.000,'active',NULL,NULL,'2026-07-18 12:37:55','2026-07-18 12:37:55',NULL),(29,16,1,NULL,4,'Labour Charges','SRV-LBR-001',NULL,NULL,'Labor, loading, and unloading charges',0.000,'active',NULL,NULL,'2026-07-18 12:37:55','2026-07-18 12:37:55',NULL),(30,16,1,NULL,4,'Other Charges','SRV-OTH-001',NULL,NULL,'General miscellaneous service charges',0.000,'active',NULL,NULL,'2026-07-18 12:37:55','2026-07-18 12:37:55',NULL);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_batches`
--

DROP TABLE IF EXISTS `purchase_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `purchase_batches` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `store_id` bigint(20) unsigned NOT NULL,
  `purchase_id` bigint(20) unsigned NOT NULL,
  `purchase_item_id` bigint(20) unsigned NOT NULL,
  `supplier_id` bigint(20) unsigned NOT NULL,
  `product_id` bigint(20) unsigned NOT NULL,
  `batch_number` varchar(100) NOT NULL,
  `purchase_date` date NOT NULL,
  `purchase_quantity` decimal(15,3) NOT NULL,
  `available_quantity` decimal(15,3) NOT NULL,
  `sold_quantity` decimal(15,3) NOT NULL DEFAULT 0.000,
  `purchase_return_quantity` decimal(15,3) NOT NULL DEFAULT 0.000,
  `sales_return_quantity` decimal(15,3) NOT NULL DEFAULT 0.000,
  `damage_quantity` decimal(15,3) NOT NULL DEFAULT 0.000,
  `adjustment_quantity` decimal(15,3) NOT NULL DEFAULT 0.000,
  `purchase_price` decimal(15,2) NOT NULL,
  `selling_price` decimal(15,2) NOT NULL DEFAULT 0.00,
  `landed_cost` decimal(15,2) NOT NULL,
  `gst_rate` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `expiry_date` date DEFAULT NULL,
  `status` enum('active','exhausted','cancelled','returned') NOT NULL DEFAULT 'active',
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `purchase_batches_purchase_id_foreign` (`purchase_id`),
  KEY `purchase_batches_purchase_item_id_foreign` (`purchase_item_id`),
  KEY `purchase_batches_supplier_id_foreign` (`supplier_id`),
  KEY `purchase_batches_created_by_foreign` (`created_by`),
  KEY `purchase_batches_store_id_index` (`store_id`),
  KEY `purchase_batches_product_id_index` (`product_id`),
  KEY `purchase_batches_batch_number_index` (`batch_number`),
  KEY `purchase_batches_purchase_date_index` (`purchase_date`),
  KEY `purchase_batches_status_index` (`status`),
  KEY `idx_batch_store_product_status` (`store_id`,`product_id`,`status`),
  KEY `idx_batch_fifo_lookup` (`store_id`,`product_id`,`available_quantity`,`purchase_date`),
  KEY `idx_batch_product_avail` (`product_id`,`available_quantity`),
  CONSTRAINT `purchase_batches_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `purchase_batches_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `purchase_batches_purchase_id_foreign` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`),
  CONSTRAINT `purchase_batches_purchase_item_id_foreign` FOREIGN KEY (`purchase_item_id`) REFERENCES `purchase_items` (`id`),
  CONSTRAINT `purchase_batches_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`),
  CONSTRAINT `purchase_batches_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_batches`
--

LOCK TABLES `purchase_batches` WRITE;
/*!40000 ALTER TABLE `purchase_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_items`
--

DROP TABLE IF EXISTS `purchase_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `purchase_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `purchase_id` bigint(20) unsigned NOT NULL,
  `product_id` bigint(20) unsigned NOT NULL,
  `unit_id` bigint(20) unsigned DEFAULT NULL,
  `quantity` decimal(15,3) NOT NULL,
  `purchase_price` decimal(15,2) NOT NULL,
  `selling_price` decimal(15,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `taxable_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `gst_rate` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `additional_cost_share` decimal(15,2) NOT NULL DEFAULT 0.00,
  `landed_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `line_total` decimal(15,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `purchase_items_unit_id_foreign` (`unit_id`),
  KEY `purchase_items_purchase_id_index` (`purchase_id`),
  KEY `purchase_items_product_id_index` (`product_id`),
  CONSTRAINT `purchase_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `purchase_items_purchase_id_foreign` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`),
  CONSTRAINT `purchase_items_unit_id_foreign` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_items`
--

LOCK TABLES `purchase_items` WRITE;
/*!40000 ALTER TABLE `purchase_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_return_items`
--

DROP TABLE IF EXISTS `purchase_return_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `purchase_return_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `purchase_return_id` bigint(20) unsigned NOT NULL,
  `purchase_item_id` bigint(20) unsigned DEFAULT NULL,
  `product_id` bigint(20) unsigned NOT NULL,
  `batch_id` bigint(20) unsigned NOT NULL,
  `unit_id` bigint(20) unsigned DEFAULT NULL,
  `quantity` decimal(15,3) NOT NULL,
  `purchase_price` decimal(15,2) NOT NULL,
  `gst_rate` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `line_total` decimal(15,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `purchase_return_items_unit_id_foreign` (`unit_id`),
  KEY `purchase_return_items_purchase_return_id_index` (`purchase_return_id`),
  KEY `purchase_return_items_purchase_item_id_index` (`purchase_item_id`),
  KEY `purchase_return_items_batch_id_index` (`batch_id`),
  KEY `purchase_return_items_product_id_index` (`product_id`),
  CONSTRAINT `purchase_return_items_batch_id_foreign` FOREIGN KEY (`batch_id`) REFERENCES `purchase_batches` (`id`),
  CONSTRAINT `purchase_return_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `purchase_return_items_purchase_item_id_foreign` FOREIGN KEY (`purchase_item_id`) REFERENCES `purchase_items` (`id`),
  CONSTRAINT `purchase_return_items_purchase_return_id_foreign` FOREIGN KEY (`purchase_return_id`) REFERENCES `purchase_returns` (`id`),
  CONSTRAINT `purchase_return_items_unit_id_foreign` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_return_items`
--

LOCK TABLES `purchase_return_items` WRITE;
/*!40000 ALTER TABLE `purchase_return_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_return_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_returns`
--

DROP TABLE IF EXISTS `purchase_returns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `purchase_returns` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `store_id` bigint(20) unsigned NOT NULL,
  `purchase_id` bigint(20) unsigned NOT NULL,
  `supplier_id` bigint(20) unsigned NOT NULL,
  `return_number` varchar(100) NOT NULL,
  `return_date` date NOT NULL,
  `subtotal` decimal(15,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `round_off` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `status` enum('draft','confirmed','cancelled','returned') NOT NULL DEFAULT 'draft',
  `remarks` text DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `approved_by` bigint(20) unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `cancelled_by` bigint(20) unsigned DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `purchase_returns_return_number_unique` (`return_number`),
  KEY `purchase_returns_created_by_foreign` (`created_by`),
  KEY `purchase_returns_approved_by_foreign` (`approved_by`),
  KEY `purchase_returns_cancelled_by_foreign` (`cancelled_by`),
  KEY `purchase_returns_store_id_index` (`store_id`),
  KEY `purchase_returns_purchase_id_index` (`purchase_id`),
  KEY `purchase_returns_supplier_id_index` (`supplier_id`),
  KEY `purchase_returns_return_date_index` (`return_date`),
  KEY `purchase_returns_status_index` (`status`),
  CONSTRAINT `purchase_returns_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `purchase_returns_cancelled_by_foreign` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `purchase_returns_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `purchase_returns_purchase_id_foreign` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`),
  CONSTRAINT `purchase_returns_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`),
  CONSTRAINT `purchase_returns_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_returns`
--

LOCK TABLES `purchase_returns` WRITE;
/*!40000 ALTER TABLE `purchase_returns` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_returns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchases`
--

DROP TABLE IF EXISTS `purchases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `purchases` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `store_id` bigint(20) unsigned NOT NULL,
  `supplier_id` bigint(20) unsigned NOT NULL,
  `purchase_number` varchar(100) NOT NULL,
  `supplier_invoice_number` varchar(100) DEFAULT NULL,
  `purchase_date` date NOT NULL,
  `subtotal` decimal(15,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `additional_cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `round_off` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `paid_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `balance_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `status` enum('draft','submitted','approved','confirmed','partially_paid','paid','cancelled','returned') NOT NULL DEFAULT 'draft',
  `remarks` text DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `approved_by` bigint(20) unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `cancelled_by` bigint(20) unsigned DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `bill_attachment` varchar(500) DEFAULT NULL,
  `bill_attachment_original_name` varchar(300) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `purchases_purchase_number_unique` (`purchase_number`),
  KEY `purchases_created_by_foreign` (`created_by`),
  KEY `purchases_approved_by_foreign` (`approved_by`),
  KEY `purchases_cancelled_by_foreign` (`cancelled_by`),
  KEY `purchases_store_id_index` (`store_id`),
  KEY `purchases_supplier_id_index` (`supplier_id`),
  KEY `purchases_purchase_date_index` (`purchase_date`),
  KEY `purchases_status_index` (`status`),
  KEY `purchases_store_id_purchase_date_index` (`store_id`,`purchase_date`),
  KEY `purchases_store_id_supplier_id_purchase_date_index` (`store_id`,`supplier_id`,`purchase_date`),
  CONSTRAINT `purchases_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `purchases_cancelled_by_foreign` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `purchases_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `purchases_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`),
  CONSTRAINT `purchases_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchases`
--

LOCK TABLES `purchases` WRITE;
/*!40000 ALTER TABLE `purchases` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `role_permissions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `role_id` bigint(20) unsigned NOT NULL,
  `permission_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_permissions_role_id_permission_id_unique` (`role_id`,`permission_id`),
  KEY `role_permissions_permission_id_foreign` (`permission_id`),
  CONSTRAINT `role_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=89 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (1,1,43,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(2,1,11,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(3,1,12,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(4,1,13,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(5,1,46,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(6,1,22,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(7,1,23,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(8,1,24,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(9,1,25,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(10,1,26,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(11,1,27,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(12,1,28,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(13,1,29,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(14,1,7,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(15,1,8,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(16,1,9,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(17,1,10,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(18,1,17,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(19,1,18,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(20,1,19,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(21,1,20,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(22,1,21,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(23,1,36,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(24,1,37,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(25,1,30,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(26,1,31,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(27,1,32,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(28,1,45,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(29,1,38,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(30,1,39,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(31,1,40,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(32,1,41,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(33,1,42,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(34,1,44,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(35,1,33,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(36,1,34,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(37,1,35,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(38,1,5,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(39,1,6,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(40,1,14,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(41,1,15,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(42,1,16,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(43,1,1,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(44,1,2,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(45,1,3,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(46,1,4,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(47,2,12,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(48,2,23,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(49,2,28,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(50,2,8,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(51,2,18,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(52,2,31,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(53,2,15,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(54,2,2,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(55,2,20,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(56,2,42,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(57,2,25,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(58,2,21,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(59,2,32,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(60,2,10,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(61,2,4,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(62,2,41,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(63,2,13,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(64,2,24,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(65,2,9,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(66,2,19,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(67,2,16,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(68,2,3,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(69,2,37,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(70,2,40,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(71,2,46,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(72,2,26,'2026-07-18 11:01:33','2026-07-18 11:01:33'),(73,2,29,'2026-07-18 11:01:34','2026-07-18 11:01:34'),(74,2,34,'2026-07-18 11:01:34','2026-07-18 11:01:34'),(75,2,35,'2026-07-18 11:01:34','2026-07-18 11:01:34'),(76,2,38,'2026-07-18 11:01:34','2026-07-18 11:01:34'),(77,2,11,'2026-07-18 11:01:34','2026-07-18 11:01:34'),(78,2,22,'2026-07-18 11:01:34','2026-07-18 11:01:34'),(79,2,27,'2026-07-18 11:01:34','2026-07-18 11:01:34'),(80,2,7,'2026-07-18 11:01:34','2026-07-18 11:01:34'),(81,2,39,'2026-07-18 11:01:34','2026-07-18 11:01:34'),(82,2,17,'2026-07-18 11:01:34','2026-07-18 11:01:34'),(83,2,36,'2026-07-18 11:01:34','2026-07-18 11:01:34'),(84,2,30,'2026-07-18 11:01:34','2026-07-18 11:01:34'),(85,2,33,'2026-07-18 11:01:34','2026-07-18 11:01:34'),(86,2,5,'2026-07-18 11:01:34','2026-07-18 11:01:34'),(87,2,14,'2026-07-18 11:01:34','2026-07-18 11:01:34'),(88,2,1,'2026-07-18 11:01:34','2026-07-18 11:01:34');
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_slug_unique` (`slug`),
  KEY `roles_status_index` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Super Admin','super_admin','Full system access across all stores.',1,'active','2026-07-18 11:01:33','2026-07-18 11:01:33'),(2,'Admin','admin','Store-level admin access.',1,'active','2026-07-18 11:01:33','2026-07-18 11:01:33'),(3,'Manager','manager','Store manager with operational access.',1,'active','2026-07-18 11:01:34','2026-07-18 11:01:34'),(4,'Salesman','salesman','Sales counter access.',1,'active','2026-07-18 11:01:34','2026-07-18 11:01:34'),(5,'Accountant','accountant','Financial and ledger access.',1,'active','2026-07-18 11:01:34','2026-07-18 11:01:34'),(6,'Store Keeper','store_keeper','Inventory and stock management access.',1,'active','2026-07-18 11:01:34','2026-07-18 11:01:34');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_batch_allocations`
--

DROP TABLE IF EXISTS `sales_batch_allocations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sales_batch_allocations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `store_id` bigint(20) unsigned NOT NULL,
  `invoice_id` bigint(20) unsigned NOT NULL,
  `invoice_item_id` bigint(20) unsigned NOT NULL,
  `product_id` bigint(20) unsigned NOT NULL,
  `batch_id` bigint(20) unsigned NOT NULL,
  `quantity` decimal(15,3) NOT NULL,
  `purchase_price` decimal(15,2) NOT NULL,
  `landed_cost` decimal(15,2) NOT NULL,
  `selling_price` decimal(15,2) NOT NULL,
  `discount_share` decimal(15,2) NOT NULL DEFAULT 0.00,
  `taxable_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `cost_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `sale_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `profit_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sales_batch_allocations_invoice_id_index` (`invoice_id`),
  KEY `sales_batch_allocations_invoice_item_id_index` (`invoice_item_id`),
  KEY `sales_batch_allocations_batch_id_index` (`batch_id`),
  KEY `sales_batch_allocations_product_id_index` (`product_id`),
  KEY `sales_batch_allocations_store_id_index` (`store_id`),
  CONSTRAINT `sales_batch_allocations_batch_id_foreign` FOREIGN KEY (`batch_id`) REFERENCES `purchase_batches` (`id`),
  CONSTRAINT `sales_batch_allocations_invoice_id_foreign` FOREIGN KEY (`invoice_id`) REFERENCES `sales_invoices` (`id`),
  CONSTRAINT `sales_batch_allocations_invoice_item_id_foreign` FOREIGN KEY (`invoice_item_id`) REFERENCES `sales_invoice_items` (`id`),
  CONSTRAINT `sales_batch_allocations_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `sales_batch_allocations_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_batch_allocations`
--

LOCK TABLES `sales_batch_allocations` WRITE;
/*!40000 ALTER TABLE `sales_batch_allocations` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales_batch_allocations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_invoice_items`
--

DROP TABLE IF EXISTS `sales_invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sales_invoice_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `invoice_id` bigint(20) unsigned NOT NULL,
  `product_id` bigint(20) unsigned NOT NULL,
  `product_name_snapshot` varchar(300) DEFAULT NULL,
  `unit_id` bigint(20) unsigned DEFAULT NULL,
  `unit_name_snapshot` varchar(100) DEFAULT NULL,
  `hsn_code_snapshot` varchar(20) DEFAULT NULL,
  `quantity` decimal(15,3) NOT NULL,
  `rate` decimal(15,2) NOT NULL,
  `discount_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `overall_discount_share` decimal(15,2) NOT NULL DEFAULT 0.00,
  `taxable_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `gst_rate` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `cgst_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `sgst_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `igst_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `line_total` decimal(15,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sales_invoice_items_unit_id_foreign` (`unit_id`),
  KEY `sales_invoice_items_invoice_id_index` (`invoice_id`),
  KEY `sales_invoice_items_product_id_index` (`product_id`),
  CONSTRAINT `sales_invoice_items_invoice_id_foreign` FOREIGN KEY (`invoice_id`) REFERENCES `sales_invoices` (`id`),
  CONSTRAINT `sales_invoice_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `sales_invoice_items_unit_id_foreign` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_invoice_items`
--

LOCK TABLES `sales_invoice_items` WRITE;
/*!40000 ALTER TABLE `sales_invoice_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales_invoice_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_invoices`
--

DROP TABLE IF EXISTS `sales_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sales_invoices` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `store_id` bigint(20) unsigned NOT NULL,
  `customer_id` bigint(20) unsigned NOT NULL,
  `invoice_number` varchar(100) NOT NULL,
  `invoice_date` date NOT NULL,
  `customer_name_snapshot` varchar(300) DEFAULT NULL,
  `customer_mobile_snapshot` varchar(15) DEFAULT NULL,
  `customer_address_snapshot` text DEFAULT NULL,
  `customer_gst_snapshot` varchar(20) DEFAULT NULL,
  `subtotal` decimal(15,2) NOT NULL DEFAULT 0.00,
  `item_discount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `overall_discount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `taxable_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `cgst_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `sgst_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `igst_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `round_off` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `paid_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `balance_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `payment_status` enum('unpaid','partially_paid','paid') NOT NULL DEFAULT 'unpaid',
  `status` enum('draft','confirmed','partially_paid','paid','partially_returned','fully_returned','cancelled','returned') NOT NULL DEFAULT 'draft',
  `remarks` text DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `cancelled_by` bigint(20) unsigned DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sales_invoices_invoice_number_unique` (`invoice_number`),
  KEY `sales_invoices_created_by_foreign` (`created_by`),
  KEY `sales_invoices_cancelled_by_foreign` (`cancelled_by`),
  KEY `sales_invoices_store_id_index` (`store_id`),
  KEY `sales_invoices_customer_id_index` (`customer_id`),
  KEY `sales_invoices_invoice_date_index` (`invoice_date`),
  KEY `sales_invoices_status_index` (`status`),
  KEY `sales_invoices_payment_status_index` (`payment_status`),
  KEY `sales_invoices_store_id_invoice_date_index` (`store_id`,`invoice_date`),
  KEY `sales_invoices_store_id_customer_id_invoice_date_index` (`store_id`,`customer_id`,`invoice_date`),
  CONSTRAINT `sales_invoices_cancelled_by_foreign` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sales_invoices_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sales_invoices_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `sales_invoices_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_invoices`
--

LOCK TABLES `sales_invoices` WRITE;
/*!40000 ALTER TABLE `sales_invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales_invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_return_batch_allocations`
--

DROP TABLE IF EXISTS `sales_return_batch_allocations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sales_return_batch_allocations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `store_id` bigint(20) unsigned NOT NULL,
  `sales_return_id` bigint(20) unsigned NOT NULL,
  `sales_return_item_id` bigint(20) unsigned NOT NULL,
  `product_id` bigint(20) unsigned NOT NULL,
  `batch_id` bigint(20) unsigned NOT NULL,
  `original_allocation_id` bigint(20) unsigned DEFAULT NULL,
  `quantity` decimal(15,3) NOT NULL,
  `purchase_price` decimal(15,2) NOT NULL,
  `landed_cost` decimal(15,2) NOT NULL,
  `selling_price` decimal(15,2) NOT NULL,
  `cost_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `sale_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `profit_reversed` decimal(15,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sales_return_batch_allocations_store_id_foreign` (`store_id`),
  KEY `sales_return_batch_allocations_sales_return_item_id_foreign` (`sales_return_item_id`),
  KEY `sales_return_batch_allocations_original_allocation_id_foreign` (`original_allocation_id`),
  KEY `sales_return_batch_allocations_sales_return_id_index` (`sales_return_id`),
  KEY `sales_return_batch_allocations_batch_id_index` (`batch_id`),
  KEY `sales_return_batch_allocations_product_id_index` (`product_id`),
  CONSTRAINT `sales_return_batch_allocations_batch_id_foreign` FOREIGN KEY (`batch_id`) REFERENCES `purchase_batches` (`id`),
  CONSTRAINT `sales_return_batch_allocations_original_allocation_id_foreign` FOREIGN KEY (`original_allocation_id`) REFERENCES `sales_batch_allocations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sales_return_batch_allocations_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `sales_return_batch_allocations_sales_return_id_foreign` FOREIGN KEY (`sales_return_id`) REFERENCES `sales_returns` (`id`),
  CONSTRAINT `sales_return_batch_allocations_sales_return_item_id_foreign` FOREIGN KEY (`sales_return_item_id`) REFERENCES `sales_return_items` (`id`),
  CONSTRAINT `sales_return_batch_allocations_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_return_batch_allocations`
--

LOCK TABLES `sales_return_batch_allocations` WRITE;
/*!40000 ALTER TABLE `sales_return_batch_allocations` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales_return_batch_allocations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_return_items`
--

DROP TABLE IF EXISTS `sales_return_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sales_return_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `sales_return_id` bigint(20) unsigned NOT NULL,
  `invoice_item_id` bigint(20) unsigned DEFAULT NULL,
  `product_id` bigint(20) unsigned NOT NULL,
  `unit_id` bigint(20) unsigned DEFAULT NULL,
  `quantity` decimal(15,3) NOT NULL,
  `rate` decimal(15,2) NOT NULL,
  `discount_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `taxable_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `gst_rate` decimal(7,4) NOT NULL DEFAULT 0.0000,
  `cgst_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `sgst_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `igst_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `line_total` decimal(15,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sales_return_items_unit_id_foreign` (`unit_id`),
  KEY `sales_return_items_sales_return_id_index` (`sales_return_id`),
  KEY `sales_return_items_invoice_item_id_index` (`invoice_item_id`),
  KEY `sales_return_items_product_id_index` (`product_id`),
  CONSTRAINT `sales_return_items_invoice_item_id_foreign` FOREIGN KEY (`invoice_item_id`) REFERENCES `sales_invoice_items` (`id`),
  CONSTRAINT `sales_return_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `sales_return_items_sales_return_id_foreign` FOREIGN KEY (`sales_return_id`) REFERENCES `sales_returns` (`id`),
  CONSTRAINT `sales_return_items_unit_id_foreign` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_return_items`
--

LOCK TABLES `sales_return_items` WRITE;
/*!40000 ALTER TABLE `sales_return_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales_return_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_returns`
--

DROP TABLE IF EXISTS `sales_returns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sales_returns` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `store_id` bigint(20) unsigned NOT NULL,
  `invoice_id` bigint(20) unsigned NOT NULL,
  `customer_id` bigint(20) unsigned NOT NULL,
  `return_number` varchar(100) NOT NULL,
  `return_date` date NOT NULL,
  `subtotal` decimal(15,2) NOT NULL DEFAULT 0.00,
  `item_discount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `taxable_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `cgst_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `sgst_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `igst_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `round_off` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `refund_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `status` enum('draft','confirmed','cancelled','returned') NOT NULL DEFAULT 'draft',
  `remarks` text DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `approved_by` bigint(20) unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `cancelled_by` bigint(20) unsigned DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sales_returns_return_number_unique` (`return_number`),
  KEY `sales_returns_created_by_foreign` (`created_by`),
  KEY `sales_returns_approved_by_foreign` (`approved_by`),
  KEY `sales_returns_cancelled_by_foreign` (`cancelled_by`),
  KEY `sales_returns_store_id_index` (`store_id`),
  KEY `sales_returns_invoice_id_index` (`invoice_id`),
  KEY `sales_returns_customer_id_index` (`customer_id`),
  KEY `sales_returns_return_date_index` (`return_date`),
  KEY `sales_returns_status_index` (`status`),
  CONSTRAINT `sales_returns_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sales_returns_cancelled_by_foreign` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sales_returns_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sales_returns_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `sales_returns_invoice_id_foreign` FOREIGN KEY (`invoice_id`) REFERENCES `sales_invoices` (`id`),
  CONSTRAINT `sales_returns_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_returns`
--

LOCK TABLES `sales_returns` WRITE;
/*!40000 ALTER TABLE `sales_returns` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales_returns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `store_id` bigint(20) unsigned DEFAULT NULL,
  `key` varchar(100) NOT NULL,
  `value` text DEFAULT NULL,
  `group` varchar(50) NOT NULL DEFAULT 'general',
  `type` varchar(20) NOT NULL DEFAULT 'string',
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `settings_store_id_key_unique` (`store_id`,`key`),
  KEY `settings_group_index` (`group`),
  CONSTRAINT `settings_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,1,'company_name','Build ERP','general','string','Business name displayed on invoices','2026-07-18 11:01:36','2026-07-18 11:01:36'),(2,1,'company_address','123, Building Materials Market, Mumbai','general','string','Business address for invoices','2026-07-18 11:01:36','2026-07-18 11:01:36'),(3,1,'company_phone','9999999999','general','string','Business contact number','2026-07-18 11:01:36','2026-07-18 11:01:36'),(4,1,'company_email','contact@buildingerp.com','general','string','Business email address','2026-07-18 11:01:36','2026-07-18 11:01:36'),(5,1,'company_gst','27AAAAA0000A1Z5','general','string','GST registration number','2026-07-18 11:01:36','2026-07-18 11:01:36'),(6,1,'invoice_prefix','INV','invoice','string','Prefix for sales invoice numbers','2026-07-18 11:01:36','2026-07-18 11:01:36'),(7,1,'purchase_prefix','PUR','invoice','string','Prefix for purchase invoice numbers','2026-07-18 11:01:36','2026-07-18 11:01:36'),(8,1,'default_credit_limit','100000','customer','number','Default credit limit for new customers','2026-07-18 11:01:36','2026-07-18 11:01:36'),(9,1,'low_stock_threshold','10','inventory','number','Minimum stock level before low-stock warning','2026-07-18 11:01:36','2026-07-18 11:01:36'),(10,1,'currency_symbol','₹','general','string','Currency symbol for amounts','2026-07-18 11:01:36','2026-07-18 11:01:36'),(11,1,'date_format','DD/MM/YYYY','general','string','Date display format','2026-07-18 11:01:36','2026-07-18 11:01:36'),(12,1,'enable_gst','true','general','boolean','Enable GST calculations','2026-07-18 11:01:36','2026-07-18 11:01:36'),(13,1,'default_payment_mode_id','','payment','number','Default payment mode for new transactions','2026-07-18 11:01:36','2026-07-18 11:01:36'),(14,1,'round_off','true','invoice','boolean','Round off invoice totals to nearest rupee','2026-07-18 11:01:36','2026-07-18 11:01:36');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_adjustment_items`
--

DROP TABLE IF EXISTS `stock_adjustment_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_adjustment_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `stock_adjustment_id` bigint(20) unsigned NOT NULL,
  `product_id` bigint(20) unsigned NOT NULL,
  `batch_id` bigint(20) unsigned NOT NULL,
  `unit_id` bigint(20) unsigned DEFAULT NULL,
  `quantity` decimal(15,3) NOT NULL,
  `reason` varchar(200) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_adjustment_items_unit_id_foreign` (`unit_id`),
  KEY `stock_adjustment_items_stock_adjustment_id_index` (`stock_adjustment_id`),
  KEY `stock_adjustment_items_product_id_index` (`product_id`),
  KEY `stock_adjustment_items_batch_id_index` (`batch_id`),
  CONSTRAINT `stock_adjustment_items_batch_id_foreign` FOREIGN KEY (`batch_id`) REFERENCES `purchase_batches` (`id`),
  CONSTRAINT `stock_adjustment_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `stock_adjustment_items_stock_adjustment_id_foreign` FOREIGN KEY (`stock_adjustment_id`) REFERENCES `stock_adjustments` (`id`),
  CONSTRAINT `stock_adjustment_items_unit_id_foreign` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_adjustment_items`
--

LOCK TABLES `stock_adjustment_items` WRITE;
/*!40000 ALTER TABLE `stock_adjustment_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_adjustment_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_adjustments`
--

DROP TABLE IF EXISTS `stock_adjustments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_adjustments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `store_id` bigint(20) unsigned NOT NULL,
  `adjustment_number` varchar(100) NOT NULL,
  `adjustment_date` date NOT NULL,
  `type` enum('addition','deduction','damage','increase','decrease','shortage','excess','manual_correction') NOT NULL,
  `status` enum('draft','submitted','approved','confirmed','cancelled','returned') NOT NULL DEFAULT 'draft',
  `reason` text DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `approved_by` bigint(20) unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `cancelled_by` bigint(20) unsigned DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stock_adjustments_adjustment_number_unique` (`adjustment_number`),
  KEY `stock_adjustments_created_by_foreign` (`created_by`),
  KEY `stock_adjustments_approved_by_foreign` (`approved_by`),
  KEY `stock_adjustments_cancelled_by_foreign` (`cancelled_by`),
  KEY `stock_adjustments_store_id_index` (`store_id`),
  KEY `stock_adjustments_adjustment_date_index` (`adjustment_date`),
  KEY `stock_adjustments_type_index` (`type`),
  KEY `stock_adjustments_status_index` (`status`),
  CONSTRAINT `stock_adjustments_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `stock_adjustments_cancelled_by_foreign` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `stock_adjustments_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `stock_adjustments_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_adjustments`
--

LOCK TABLES `stock_adjustments` WRITE;
/*!40000 ALTER TABLE `stock_adjustments` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_adjustments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_transfer_batch_allocations`
--

DROP TABLE IF EXISTS `stock_transfer_batch_allocations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_transfer_batch_allocations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `stock_transfer_id` bigint(20) unsigned NOT NULL,
  `stock_transfer_item_id` bigint(20) unsigned NOT NULL,
  `product_id` bigint(20) unsigned NOT NULL,
  `source_batch_id` bigint(20) unsigned NOT NULL,
  `destination_batch_id` bigint(20) unsigned DEFAULT NULL,
  `quantity` decimal(15,3) NOT NULL,
  `purchase_price` decimal(15,2) NOT NULL,
  `landed_cost` decimal(15,2) NOT NULL,
  `selling_price` decimal(15,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_transfer_batch_allocations_stock_transfer_item_id_foreign` (`stock_transfer_item_id`),
  KEY `stock_transfer_batch_allocations_stock_transfer_id_index` (`stock_transfer_id`),
  KEY `stock_transfer_batch_allocations_source_batch_id_index` (`source_batch_id`),
  KEY `stock_transfer_batch_allocations_destination_batch_id_index` (`destination_batch_id`),
  KEY `stock_transfer_batch_allocations_product_id_index` (`product_id`),
  CONSTRAINT `stock_transfer_batch_allocations_destination_batch_id_foreign` FOREIGN KEY (`destination_batch_id`) REFERENCES `purchase_batches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `stock_transfer_batch_allocations_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `stock_transfer_batch_allocations_source_batch_id_foreign` FOREIGN KEY (`source_batch_id`) REFERENCES `purchase_batches` (`id`),
  CONSTRAINT `stock_transfer_batch_allocations_stock_transfer_id_foreign` FOREIGN KEY (`stock_transfer_id`) REFERENCES `stock_transfers` (`id`),
  CONSTRAINT `stock_transfer_batch_allocations_stock_transfer_item_id_foreign` FOREIGN KEY (`stock_transfer_item_id`) REFERENCES `stock_transfer_items` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_transfer_batch_allocations`
--

LOCK TABLES `stock_transfer_batch_allocations` WRITE;
/*!40000 ALTER TABLE `stock_transfer_batch_allocations` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_transfer_batch_allocations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_transfer_items`
--

DROP TABLE IF EXISTS `stock_transfer_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_transfer_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `stock_transfer_id` bigint(20) unsigned NOT NULL,
  `product_id` bigint(20) unsigned NOT NULL,
  `unit_id` bigint(20) unsigned DEFAULT NULL,
  `quantity` decimal(15,3) NOT NULL,
  `received_quantity` decimal(15,3) NOT NULL DEFAULT 0.000,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_transfer_items_unit_id_foreign` (`unit_id`),
  KEY `stock_transfer_items_stock_transfer_id_index` (`stock_transfer_id`),
  KEY `stock_transfer_items_product_id_index` (`product_id`),
  CONSTRAINT `stock_transfer_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `stock_transfer_items_stock_transfer_id_foreign` FOREIGN KEY (`stock_transfer_id`) REFERENCES `stock_transfers` (`id`),
  CONSTRAINT `stock_transfer_items_unit_id_foreign` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_transfer_items`
--

LOCK TABLES `stock_transfer_items` WRITE;
/*!40000 ALTER TABLE `stock_transfer_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_transfer_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_transfers`
--

DROP TABLE IF EXISTS `stock_transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_transfers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `source_store_id` bigint(20) unsigned NOT NULL,
  `destination_store_id` bigint(20) unsigned NOT NULL,
  `transfer_number` varchar(100) NOT NULL,
  `transfer_date` date NOT NULL,
  `status` enum('draft','submitted','approved','dispatched','received','cancelled') NOT NULL DEFAULT 'draft',
  `remarks` text DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `approved_by` bigint(20) unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `dispatched_by` bigint(20) unsigned DEFAULT NULL,
  `dispatched_at` timestamp NULL DEFAULT NULL,
  `received_by` bigint(20) unsigned DEFAULT NULL,
  `received_at` timestamp NULL DEFAULT NULL,
  `cancelled_by` bigint(20) unsigned DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stock_transfers_transfer_number_unique` (`transfer_number`),
  KEY `stock_transfers_created_by_foreign` (`created_by`),
  KEY `stock_transfers_approved_by_foreign` (`approved_by`),
  KEY `stock_transfers_dispatched_by_foreign` (`dispatched_by`),
  KEY `stock_transfers_received_by_foreign` (`received_by`),
  KEY `stock_transfers_cancelled_by_foreign` (`cancelled_by`),
  KEY `stock_transfers_source_store_id_index` (`source_store_id`),
  KEY `stock_transfers_destination_store_id_index` (`destination_store_id`),
  KEY `stock_transfers_transfer_date_index` (`transfer_date`),
  KEY `stock_transfers_status_index` (`status`),
  CONSTRAINT `stock_transfers_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `stock_transfers_cancelled_by_foreign` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `stock_transfers_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `stock_transfers_destination_store_id_foreign` FOREIGN KEY (`destination_store_id`) REFERENCES `stores` (`id`),
  CONSTRAINT `stock_transfers_dispatched_by_foreign` FOREIGN KEY (`dispatched_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `stock_transfers_received_by_foreign` FOREIGN KEY (`received_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `stock_transfers_source_store_id_foreign` FOREIGN KEY (`source_store_id`) REFERENCES `stores` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_transfers`
--

LOCK TABLES `stock_transfers` WRITE;
/*!40000 ALTER TABLE `stock_transfers` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_transfers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `store_users`
--

DROP TABLE IF EXISTS `store_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `store_users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `store_id` bigint(20) unsigned NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `store_users_user_id_store_id_unique` (`user_id`,`store_id`),
  KEY `store_users_store_id_index` (`store_id`),
  KEY `store_users_status_index` (`status`),
  CONSTRAINT `store_users_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `store_users_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `store_users`
--

LOCK TABLES `store_users` WRITE;
/*!40000 ALTER TABLE `store_users` DISABLE KEYS */;
INSERT INTO `store_users` VALUES (1,1,1,1,'active','2026-07-18 11:01:35','2026-07-18 11:01:35');
/*!40000 ALTER TABLE `store_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stores`
--

DROP TABLE IF EXISTS `stores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stores` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `code` varchar(50) NOT NULL,
  `mobile` varchar(15) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `gst_number` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `invoice_prefix` varchar(20) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stores_code_unique` (`code`),
  KEY `stores_status_index` (`status`),
  KEY `stores_code_index` (`code`),
  KEY `stores_created_by_foreign` (`created_by`),
  CONSTRAINT `stores_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stores`
--

LOCK TABLES `stores` WRITE;
/*!40000 ALTER TABLE `stores` DISABLE KEYS */;
INSERT INTO `stores` VALUES (1,'Main Store','MAIN','9999999999','admin@buildingerp.com',NULL,'Main Store Address','Mumbai','Maharashtra','400001','INV','active',NULL,'2026-07-18 11:01:34','2026-07-18 11:01:34'),(2,'Andheri Branch','AND','8888888881','andheri@buildingerp.com',NULL,'Gala 5, Marol Industrial Estate, Andheri East','Mumbai','Maharashtra','400059','AND','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35'),(3,'Thane Warehouse','THN','8888888882','thane@buildingerp.com',NULL,'Plot 20, Wagle Estate, Thane West','Thane','Maharashtra','400604','THN','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35'),(4,'Navi Mumbai Outlet','NVM','8888888883','navimumbai@buildingerp.com',NULL,'Sector 19, APMC Market, Turbhe, Vashi','Navi Mumbai','Maharashtra','400703','NVM','active',NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35');
/*!40000 ALTER TABLE `stores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supplier_addresses`
--

DROP TABLE IF EXISTS `supplier_addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `supplier_addresses` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `supplier_id` bigint(20) unsigned NOT NULL,
  `address_type` varchar(50) NOT NULL DEFAULT 'billing',
  `address` text NOT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `supplier_addresses_supplier_id_index` (`supplier_id`),
  KEY `supplier_addresses_address_type_index` (`address_type`),
  CONSTRAINT `supplier_addresses_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier_addresses`
--

LOCK TABLES `supplier_addresses` WRITE;
/*!40000 ALTER TABLE `supplier_addresses` DISABLE KEYS */;
/*!40000 ALTER TABLE `supplier_addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supplier_ledgers`
--

DROP TABLE IF EXISTS `supplier_ledgers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `supplier_ledgers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `store_id` bigint(20) unsigned NOT NULL,
  `supplier_id` bigint(20) unsigned NOT NULL,
  `transaction_type` varchar(50) NOT NULL,
  `transaction_id` bigint(20) unsigned DEFAULT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `transaction_date` date NOT NULL,
  `debit_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `credit_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `running_balance` decimal(15,2) NOT NULL DEFAULT 0.00,
  `remarks` text DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `supplier_ledgers_created_by_foreign` (`created_by`),
  KEY `supplier_ledgers_store_id_index` (`store_id`),
  KEY `supplier_ledgers_supplier_id_index` (`supplier_id`),
  KEY `supplier_ledgers_transaction_type_index` (`transaction_type`),
  KEY `supplier_ledgers_transaction_date_index` (`transaction_date`),
  KEY `supplier_ledgers_store_id_supplier_id_transaction_date_index` (`store_id`,`supplier_id`,`transaction_date`),
  KEY `supplier_ledgers_transaction_type_transaction_id_index` (`transaction_type`,`transaction_id`),
  CONSTRAINT `supplier_ledgers_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `supplier_ledgers_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`),
  CONSTRAINT `supplier_ledgers_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier_ledgers`
--

LOCK TABLES `supplier_ledgers` WRITE;
/*!40000 ALTER TABLE `supplier_ledgers` DISABLE KEYS */;
/*!40000 ALTER TABLE `supplier_ledgers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supplier_payment_allocations`
--

DROP TABLE IF EXISTS `supplier_payment_allocations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `supplier_payment_allocations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `payment_id` bigint(20) unsigned NOT NULL,
  `purchase_id` bigint(20) unsigned NOT NULL,
  `allocated_amount` decimal(15,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `supplier_payment_allocations_payment_id_purchase_id_unique` (`payment_id`,`purchase_id`),
  KEY `supplier_payment_allocations_payment_id_index` (`payment_id`),
  KEY `supplier_payment_allocations_purchase_id_index` (`purchase_id`),
  CONSTRAINT `supplier_payment_allocations_payment_id_foreign` FOREIGN KEY (`payment_id`) REFERENCES `supplier_payments` (`id`),
  CONSTRAINT `supplier_payment_allocations_purchase_id_foreign` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier_payment_allocations`
--

LOCK TABLES `supplier_payment_allocations` WRITE;
/*!40000 ALTER TABLE `supplier_payment_allocations` DISABLE KEYS */;
/*!40000 ALTER TABLE `supplier_payment_allocations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supplier_payments`
--

DROP TABLE IF EXISTS `supplier_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `supplier_payments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `store_id` bigint(20) unsigned NOT NULL,
  `supplier_id` bigint(20) unsigned NOT NULL,
  `payment_number` varchar(100) NOT NULL,
  `payment_date` date NOT NULL,
  `payment_mode_id` bigint(20) unsigned DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `allocated_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `advance_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `transaction_reference` varchar(200) DEFAULT NULL,
  `status` enum('draft','confirmed','cancelled','returned') NOT NULL DEFAULT 'draft',
  `remarks` text DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `cancelled_by` bigint(20) unsigned DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `supplier_payments_payment_number_unique` (`payment_number`),
  KEY `supplier_payments_payment_mode_id_foreign` (`payment_mode_id`),
  KEY `supplier_payments_created_by_foreign` (`created_by`),
  KEY `supplier_payments_cancelled_by_foreign` (`cancelled_by`),
  KEY `supplier_payments_store_id_index` (`store_id`),
  KEY `supplier_payments_supplier_id_index` (`supplier_id`),
  KEY `supplier_payments_payment_date_index` (`payment_date`),
  KEY `supplier_payments_status_index` (`status`),
  CONSTRAINT `supplier_payments_cancelled_by_foreign` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `supplier_payments_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `supplier_payments_payment_mode_id_foreign` FOREIGN KEY (`payment_mode_id`) REFERENCES `payment_modes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `supplier_payments_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`),
  CONSTRAINT `supplier_payments_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier_payments`
--

LOCK TABLES `supplier_payments` WRITE;
/*!40000 ALTER TABLE `supplier_payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `supplier_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `suppliers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(300) NOT NULL,
  `category_id` bigint(20) unsigned DEFAULT NULL,
  `mobile` varchar(15) DEFAULT NULL,
  `normalized_mobile` varchar(15) DEFAULT NULL,
  `alternate_mobile` varchar(15) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `gst_number` varchar(20) DEFAULT NULL,
  `opening_balance` decimal(15,2) NOT NULL DEFAULT 0.00,
  `opening_balance_type` enum('debit','credit') NOT NULL DEFAULT 'credit',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `updated_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `suppliers_normalized_mobile_unique` (`normalized_mobile`),
  KEY `suppliers_created_by_foreign` (`created_by`),
  KEY `suppliers_updated_by_foreign` (`updated_by`),
  KEY `suppliers_normalized_mobile_index` (`normalized_mobile`),
  KEY `suppliers_status_index` (`status`),
  KEY `suppliers_gst_number_index` (`gst_number`),
  KEY `suppliers_category_id_foreign` (`category_id`),
  CONSTRAINT `suppliers_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `suppliers_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `suppliers_updated_by_foreign` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `units`
--

DROP TABLE IF EXISTS `units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `units` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `short_name` varchar(20) NOT NULL,
  `decimal_places` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `allow_fraction` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `units_status_index` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `units`
--

LOCK TABLES `units` WRITE;
/*!40000 ALTER TABLE `units` DISABLE KEYS */;
INSERT INTO `units` VALUES (1,'Piece','Pcs',0,0,'active','2026-07-18 11:01:32','2026-07-18 11:01:32'),(2,'Bag','Bag',0,0,'active','2026-07-18 11:01:32','2026-07-18 11:01:32'),(3,'Kilogram','Kg',3,1,'active','2026-07-18 11:01:32','2026-07-18 11:01:32'),(4,'Ton','Ton',3,1,'active','2026-07-18 11:01:32','2026-07-18 11:01:32'),(5,'Meter','Mtr',2,1,'active','2026-07-18 11:01:32','2026-07-18 11:01:32'),(6,'Foot','Ft',2,1,'active','2026-07-18 11:01:32','2026-07-18 11:01:32'),(7,'Square Foot','Sq.Ft',2,1,'active','2026-07-18 11:01:32','2026-07-18 11:01:32'),(8,'Cubic Foot','Cu.Ft',2,1,'active','2026-07-18 11:01:32','2026-07-18 11:01:32'),(9,'Bundle','Bdl',0,0,'active','2026-07-18 11:01:32','2026-07-18 11:01:32'),(10,'Liter','Ltr',2,1,'active','2026-07-18 11:01:32','2026-07-18 11:01:32'),(11,'Box','Box',0,0,'active','2026-07-18 11:01:32','2026-07-18 11:01:32'),(12,'Quintal','Qtl',2,1,'active','2026-07-18 11:01:32','2026-07-18 11:01:32');
/*!40000 ALTER TABLE `units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_roles` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `role_id` bigint(20) unsigned NOT NULL,
  `store_id` bigint(20) unsigned DEFAULT NULL,
  `assigned_by` bigint(20) unsigned DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_roles_user_id_role_id_store_id_unique` (`user_id`,`role_id`,`store_id`),
  KEY `user_roles_role_id_foreign` (`role_id`),
  KEY `user_roles_assigned_by_foreign` (`assigned_by`),
  KEY `user_roles_store_id_index` (`store_id`),
  CONSTRAINT `user_roles_assigned_by_foreign` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `user_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_roles_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE SET NULL,
  CONSTRAINT `user_roles_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (1,1,1,1,1,NULL,'2026-07-18 11:01:35','2026-07-18 11:01:35');
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `mobile` varchar(15) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `pin` varchar(100) DEFAULT NULL,
  `status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
  `last_login_at` timestamp NULL DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_mobile_unique` (`mobile`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_status_index` (`status`),
  KEY `users_mobile_index` (`mobile`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Super Admin','96287171775','admin@buildingerp.com','$2y$12$XQuIBa83K9WdNyhMd7mL/uniiQ..BKe1WyKmv98Hk0p9qHosBsG/G','$2y$12$aLpC45.KolmwDsxC8lPsMedGiuG/dpxwAGX0j3pCYDCZx.p.N7mGK','active','2026-07-22 05:09:18',NULL,'2026-07-18 11:01:35','2026-07-22 05:09:18');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-22 10:56:25
