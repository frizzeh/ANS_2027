CREATE TABLE `users` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `email` varchar(255) UNIQUE NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `title_before` varchar(255),
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `title_after` varchar(255),
  `organization` varchar(255),
  `organization_address` varchar(255),
  `department` varchar(255),
  `country` varchar(255),
  `preferred_language` varchar(255) DEFAULT 'sk',
  `is_active` boolean DEFAULT true,
  `last_login_at` datetime,
  `created_at` datetime DEFAULT (now())
);

CREATE TABLE `roles` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `code` varchar(255) UNIQUE NOT NULL,
  `name_sk` varchar(255),
  `name_en` varchar(255)
);

CREATE TABLE `user_roles` (
  `user_id` int NOT NULL,
  `role_id` int NOT NULL,
  `conference_id` int
);

CREATE TABLE `conferences` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `year` int NOT NULL,
  `slug` varchar(255) UNIQUE,
  `location` varchar(255),
  `start_date` date,
  `end_date` date,
  `iban` varchar(255),
  `currency` varchar(255) DEFAULT 'EUR',
  `accommodation_info` text,
  `program_published` boolean DEFAULT false,
  `is_archived` boolean DEFAULT false,
  `created_at` datetime DEFAULT (now())
);

CREATE TABLE `symposia` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `conference_id` int NOT NULL,
  `name_sk` varchar(255) NOT NULL,
  `name_en` varchar(255) NOT NULL,
  `sort_order` int DEFAULT 0
);

CREATE TABLE `deadlines` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `conference_id` int NOT NULL,
  `step` ENUM ('registration', 'payment', 'submission', 'review', 'revision') NOT NULL,
  `deadline_at` datetime NOT NULL
);

CREATE TABLE `participant_categories` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `conference_id` int NOT NULL,
  `code` varchar(255) NOT NULL,
  `name_sk` varchar(255) NOT NULL,
  `name_en` varchar(255) NOT NULL,
  `fee` decimal(10,2) NOT NULL,
  `student_fee` decimal(10,2),
  `submission_type` ENUM ('talk', 'poster')
);

CREATE TABLE `registrations` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `conference_id` int NOT NULL,
  `category_id` int NOT NULL,
  `is_student` boolean DEFAULT false,
  `dietary_requirements` text,
  `gdpr_consent_at` datetime NOT NULL,
  `billing_name` varchar(255),
  `billing_street` varchar(255),
  `billing_city` varchar(255),
  `billing_zip` varchar(255),
  `billing_country` varchar(255),
  `billing_ico` varchar(255),
  `billing_dic` varchar(255),
  `billing_ic_dph` varchar(255),
  `fee_exempt` boolean DEFAULT false,
  `exempt_reason` varchar(255),
  `amount_due` decimal(10,2) NOT NULL,
  `variable_symbol` varchar(255) UNIQUE NOT NULL,
  `due_date` date,
  `payment_status` ENUM ('awaiting_payment', 'partially_paid', 'paid', 'overdue', 'cancelled', 'refunded') DEFAULT 'awaiting_payment',
  `created_at` datetime DEFAULT (now())
);

CREATE TABLE `payments` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `registration_id` int NOT NULL,
  `type` ENUM ('payment', 'refund') DEFAULT 'payment',
  `amount` decimal(10,2) NOT NULL,
  `received_at` date,
  `confirmed_by` int NOT NULL,
  `confirmed_at` datetime DEFAULT (now()),
  `note` varchar(255)
);

CREATE TABLE `invoices` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `registration_id` int NOT NULL,
  `invoice_number` varchar(255) UNIQUE NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `billing_name` varchar(255),
  `billing_address` varchar(255),
  `billing_ico` varchar(255),
  `billing_dic` varchar(255),
  `billing_ic_dph` varchar(255),
  `issued_at` date NOT NULL,
  `pdf_path` varchar(255),
  `created_by` int NOT NULL
);

CREATE TABLE `submissions` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `conference_id` int NOT NULL,
  `registration_id` int NOT NULL,
  `symposium_id` int NOT NULL,
  `type` ENUM ('talk', 'poster') NOT NULL,
  `title` varchar(255) NOT NULL,
  `abstract` text NOT NULL,
  `keywords` varchar(255),
  `status` ENUM ('submitted', 'admin_check', 'in_review', 'committee_decision', 'revision_requested', 'conditionally_accepted', 'accepted', 'rejected') DEFAULT 'submitted',
  `created_at` datetime DEFAULT (now())
);

CREATE TABLE `submission_authors` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `submission_id` int NOT NULL,
  `user_id` int,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `email` varchar(255),
  `organization` varchar(255),
  `author_order` int NOT NULL,
  `is_presenter` boolean DEFAULT false
);

CREATE TABLE `submission_versions` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `submission_id` int NOT NULL,
  `version_number` int NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `original_filename` varchar(255),
  `mime_type` varchar(255),
  `file_size` int,
  `uploaded_by` int NOT NULL,
  `uploaded_at` datetime DEFAULT (now())
);

CREATE TABLE `submission_status_history` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `submission_id` int NOT NULL,
  `from_status` ENUM ('submitted', 'admin_check', 'in_review', 'committee_decision', 'revision_requested', 'conditionally_accepted', 'accepted', 'rejected'),
  `to_status` ENUM ('submitted', 'admin_check', 'in_review', 'committee_decision', 'revision_requested', 'conditionally_accepted', 'accepted', 'rejected') NOT NULL,
  `changed_by` int NOT NULL,
  `changed_at` datetime DEFAULT (now()),
  `comment` text
);

CREATE TABLE `review_assignments` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `submission_id` int NOT NULL,
  `reviewer_id` int NOT NULL,
  `assigned_by` int NOT NULL,
  `assigned_at` datetime DEFAULT (now()),
  `due_date` date,
  `status` ENUM ('assigned', 'completed', 'cancelled') DEFAULT 'assigned'
);

CREATE TABLE `reviews` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `assignment_id` int NOT NULL,
  `version_id` int NOT NULL,
  `score` int,
  `recommendation` ENUM ('accept', 'accept_after_revision', 'reject') NOT NULL,
  `comment_for_author` text,
  `comment_for_committee` text,
  `submitted_at` datetime DEFAULT (now())
);

CREATE TABLE `program_items` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `conference_id` int NOT NULL,
  `symposium_id` int,
  `submission_id` int,
  `title` varchar(255) NOT NULL,
  `room` varchar(255),
  `start_at` datetime,
  `end_at` datetime
);

CREATE TABLE `notifications` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `conference_id` int,
  `title` varchar(255) NOT NULL,
  `body` text,
  `is_read` boolean DEFAULT false,
  `created_at` datetime DEFAULT (now())
);

CREATE TABLE `email_log` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `recipient_user_id` int,
  `recipient_email` varchar(255) NOT NULL,
  `subject` varchar(255),
  `type` varchar(255),
  `sent_by` int,
  `sent_at` datetime DEFAULT (now())
);

CREATE TABLE `audit_log` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `user_id` int,
  `action` varchar(255) NOT NULL,
  `entity_type` varchar(255),
  `entity_id` int,
  `old_value` text,
  `new_value` text,
  `ip_address` varchar(255),
  `created_at` datetime DEFAULT (now())
);

CREATE UNIQUE INDEX `user_roles_index_0` ON `user_roles` (`user_id`, `role_id`, `conference_id`);

CREATE UNIQUE INDEX `deadlines_index_1` ON `deadlines` (`conference_id`, `step`);

CREATE UNIQUE INDEX `participant_categories_index_2` ON `participant_categories` (`conference_id`, `code`);

CREATE UNIQUE INDEX `registrations_index_3` ON `registrations` (`user_id`, `conference_id`);

CREATE UNIQUE INDEX `submission_versions_index_4` ON `submission_versions` (`submission_id`, `version_number`);

CREATE UNIQUE INDEX `review_assignments_index_5` ON `review_assignments` (`submission_id`, `reviewer_id`);

ALTER TABLE `user_roles` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `user_roles` ADD FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);

ALTER TABLE `user_roles` ADD FOREIGN KEY (`conference_id`) REFERENCES `conferences` (`id`);

ALTER TABLE `symposia` ADD FOREIGN KEY (`conference_id`) REFERENCES `conferences` (`id`);

ALTER TABLE `deadlines` ADD FOREIGN KEY (`conference_id`) REFERENCES `conferences` (`id`);

ALTER TABLE `participant_categories` ADD FOREIGN KEY (`conference_id`) REFERENCES `conferences` (`id`);

ALTER TABLE `registrations` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `registrations` ADD FOREIGN KEY (`conference_id`) REFERENCES `conferences` (`id`);

ALTER TABLE `registrations` ADD FOREIGN KEY (`category_id`) REFERENCES `participant_categories` (`id`);

ALTER TABLE `payments` ADD FOREIGN KEY (`registration_id`) REFERENCES `registrations` (`id`);

ALTER TABLE `payments` ADD FOREIGN KEY (`confirmed_by`) REFERENCES `users` (`id`);

ALTER TABLE `invoices` ADD FOREIGN KEY (`registration_id`) REFERENCES `registrations` (`id`);

ALTER TABLE `invoices` ADD FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

ALTER TABLE `submissions` ADD FOREIGN KEY (`conference_id`) REFERENCES `conferences` (`id`);

ALTER TABLE `submissions` ADD FOREIGN KEY (`registration_id`) REFERENCES `registrations` (`id`);

ALTER TABLE `submissions` ADD FOREIGN KEY (`symposium_id`) REFERENCES `symposia` (`id`);

ALTER TABLE `submission_authors` ADD FOREIGN KEY (`submission_id`) REFERENCES `submissions` (`id`);

ALTER TABLE `submission_authors` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `submission_versions` ADD FOREIGN KEY (`submission_id`) REFERENCES `submissions` (`id`);

ALTER TABLE `submission_versions` ADD FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`);

ALTER TABLE `submission_status_history` ADD FOREIGN KEY (`submission_id`) REFERENCES `submissions` (`id`);

ALTER TABLE `submission_status_history` ADD FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`);

ALTER TABLE `review_assignments` ADD FOREIGN KEY (`submission_id`) REFERENCES `submissions` (`id`);

ALTER TABLE `review_assignments` ADD FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`);

ALTER TABLE `review_assignments` ADD FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`);

ALTER TABLE `reviews` ADD FOREIGN KEY (`assignment_id`) REFERENCES `review_assignments` (`id`);

ALTER TABLE `reviews` ADD FOREIGN KEY (`version_id`) REFERENCES `submission_versions` (`id`);

ALTER TABLE `program_items` ADD FOREIGN KEY (`conference_id`) REFERENCES `conferences` (`id`);

ALTER TABLE `program_items` ADD FOREIGN KEY (`symposium_id`) REFERENCES `symposia` (`id`);

ALTER TABLE `program_items` ADD FOREIGN KEY (`submission_id`) REFERENCES `submissions` (`id`);

ALTER TABLE `notifications` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `notifications` ADD FOREIGN KEY (`conference_id`) REFERENCES `conferences` (`id`);

ALTER TABLE `email_log` ADD FOREIGN KEY (`recipient_user_id`) REFERENCES `users` (`id`);

ALTER TABLE `email_log` ADD FOREIGN KEY (`sent_by`) REFERENCES `users` (`id`);

ALTER TABLE `audit_log` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
