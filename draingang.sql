-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Хост: 127.0.0.1
-- Время создания: Янв 08 2025 г., 04:58
-- Версия сервера: 10.4.32-MariaDB
-- Версия PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `draingang`
--

-- --------------------------------------------------------

--
-- Структура таблицы `bank_cards`
--

CREATE TABLE `bank_cards` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `card_number` varchar(16) NOT NULL,
  `pin_code` varchar(255) NOT NULL,
  `balance` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `bonus_points` int(11) DEFAULT 0,
  `card_status` enum('REGULAR','SILVER','GOLD','PLATINUM') DEFAULT 'REGULAR',
  `total_transactions` decimal(15,2) DEFAULT 0.00,
  `last_transaction_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_blocked` tinyint(1) DEFAULT 0,
  `block_reason` varchar(255) DEFAULT NULL,
  `block_until` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `bank_cards`
--

INSERT INTO `bank_cards` (`id`, `user_id`, `card_number`, `pin_code`, `balance`, `created_at`, `bonus_points`, `card_status`, `total_transactions`, `last_transaction_date`, `is_blocked`, `block_reason`, `block_until`) VALUES
(1, 1, '6957318606684124', '$2a$10$NQgUQgwS3J0TN6OBRRKVqeXwAMdwgE/WmSo3gIFqPhc0.ITTSau2S', 3715, '2025-01-03 07:57:53', 85, 'REGULAR', 0.00, '2025-01-03 07:57:53', 0, NULL, NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `bank_transactions`
--

CREATE TABLE `bank_transactions` (
  `id` int(11) NOT NULL,
  `card_id` int(11) NOT NULL,
  `type` enum('deposit','withdraw') NOT NULL,
  `amount` int(11) NOT NULL,
  `balance_before` int(11) NOT NULL,
  `balance_after` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `ip_address` varchar(45) DEFAULT NULL,
  `cashback_amount` decimal(15,2) DEFAULT 0.00,
  `bonus_points_earned` int(11) DEFAULT 0,
  `status_at_transaction` enum('REGULAR','SILVER','GOLD','PLATINUM') DEFAULT 'REGULAR',
  `transaction_code` varchar(32) DEFAULT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `bank_transactions`
--

INSERT INTO `bank_transactions` (`id`, `card_id`, `type`, `amount`, `balance_before`, `balance_after`, `created_at`, `ip_address`, `cashback_amount`, `bonus_points_earned`, `status_at_transaction`, `transaction_code`, `description`) VALUES
(1, 1, 'deposit', 500, 0, 500, '2025-01-03 08:30:41', '::ffff:185.3.172.83', 0.00, 0, 'REGULAR', 'TXM5GHWAUVMNMSFB', 'Внесение наличных: $500'),
(2, 1, 'deposit', 500, 502, 1002, '2025-01-03 08:44:00', '::ffff:185.3.172.83', 0.00, 0, 'REGULAR', 'TXM5GIDFAJSYZX58', 'Внесение наличных: $500'),
(3, 1, 'deposit', 500, 1004, 1504, '2025-01-03 08:48:35', '::ffff:185.3.172.83', 0.00, 0, 'REGULAR', 'TXM5GIJBLPWBJL31', 'Внесение наличных: $500'),
(4, 1, 'deposit', 500, 1506, 2006, '2025-01-03 08:52:32', '::ffff:185.3.172.83', 0.00, 0, 'REGULAR', 'TXM5GIOEZLS9GI8X', 'Внесение наличных: $500'),
(5, 1, 'deposit', 500, 2008, 2508, '2025-01-03 09:17:33', '::ffff:185.3.172.83', 0.00, 0, 'REGULAR', 'TXM5GJKL0U1OVTMW', 'Внесение наличных: $500'),
(6, 1, 'deposit', 100, 2510, 2610, '2025-01-03 09:17:43', '::ffff:185.3.172.83', 0.00, 0, 'REGULAR', 'TXM5GJKSIQQBAG81', 'Внесение наличных: $100'),
(7, 1, 'deposit', 100, 2610, 2710, '2025-01-03 09:52:21', '::ffff:185.3.172.83', 0.00, 0, 'REGULAR', 'TXM5GKTBYOTB1B8L', 'Внесение наличных: $100'),
(8, 1, 'deposit', 1000, 2710, 3710, '2025-01-03 09:52:46', '::ffff:185.3.172.83', 0.00, 0, 'REGULAR', 'TXM5GKTV6G3VAA6R', 'Внесение наличных: $1000');

-- --------------------------------------------------------

--
-- Структура таблицы `characters`
--

CREATE TABLE `characters` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `model` varchar(50) NOT NULL,
  `face` int(11) NOT NULL,
  `skin_tone` int(11) NOT NULL,
  `hair` int(11) NOT NULL,
  `hair_color` int(11) NOT NULL,
  `eyebrows` int(11) NOT NULL,
  `eyebrows_color` int(11) NOT NULL,
  `facial_hair` int(11) NOT NULL,
  `facial_hair_color` int(11) NOT NULL,
  `ageing` int(11) NOT NULL,
  `complexion` int(11) NOT NULL,
  `nose_width` float NOT NULL,
  `nose_height` float NOT NULL,
  `lip_thickness` float NOT NULL,
  `jaw_width` float NOT NULL,
  `cheekbone_height` float NOT NULL,
  `last_x` float DEFAULT 0,
  `last_y` float DEFAULT 0,
  `last_z` float DEFAULT 71,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `appearance` longtext DEFAULT NULL COMMENT 'Данные о внешности персонажа в формате JSON'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `characters`
--

INSERT INTO `characters` (`id`, `user_id`, `model`, `face`, `skin_tone`, `hair`, `hair_color`, `eyebrows`, `eyebrows_color`, `facial_hair`, `facial_hair_color`, `ageing`, `complexion`, `nose_width`, `nose_height`, `lip_thickness`, `jaw_width`, `cheekbone_height`, `last_x`, `last_y`, `last_z`, `created_at`, `appearance`) VALUES
(1, 1, '', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 71, '2025-01-03 15:58:44', '{\"face\":12,\"facialHairColor\":0,\"lipThickness\":0,\"hairColor\":0,\"ageing\":0,\"gender\":\"male\",\"eyebrowsColor\":0,\"cheekboneHeight\":0,\"complexion\":10,\"eyebrows\":2,\"facialHair\":11,\"hair\":17,\"jawWidth\":0,\"noseHeight\":0,\"noseWidth\":0,\"skinTone\":1}');

-- --------------------------------------------------------

--
-- Структура таблицы `houses`
--

CREATE TABLE `houses` (
  `id` int(11) NOT NULL,
  `owner_id` int(11) DEFAULT NULL,
  `price` int(11) DEFAULT NULL,
  `last_payment_date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `houses`
--

INSERT INTO `houses` (`id`, `owner_id`, `price`, `last_payment_date`) VALUES
(1, NULL, 1500000, '2025-01-02 09:43:57'),
(2, NULL, 2500000, '2025-01-02 09:43:57'),
(3, NULL, 950000, '2025-01-02 09:43:57'),
(4, 1, 4500000, '2025-01-02 09:44:53'),
(5, NULL, 750000, '2025-01-02 09:43:57'),
(6, NULL, 3500000, '2025-01-02 09:43:57');

-- --------------------------------------------------------

--
-- Структура таблицы `house_garages`
--

CREATE TABLE `house_garages` (
  `house_id` int(11) DEFAULT NULL,
  `vehicle_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `locations`
--

CREATE TABLE `locations` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `x` float NOT NULL,
  `y` float NOT NULL,
  `z` float NOT NULL,
  `rx` float DEFAULT 0,
  `ry` float DEFAULT 0,
  `rz` float DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `money_transactions`
--

CREATE TABLE `money_transactions` (
  `id` int(11) NOT NULL,
  `player_name` varchar(255) NOT NULL,
  `type` varchar(50) NOT NULL,
  `amount` int(11) NOT NULL,
  `old_balance` int(11) NOT NULL,
  `new_balance` int(11) NOT NULL,
  `timestamp` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `isauth` tinyint(1) DEFAULT 0,
  `access_level` int(11) DEFAULT 0,
  `isbanned` tinyint(1) DEFAULT 0,
  `ban_reason` varchar(255) DEFAULT NULL,
  `money` int(11) DEFAULT 0,
  `character_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`character_data`)),
  `admin_level` int(11) DEFAULT 0 COMMENT 'Уровень администратора: 0 - обычный игрок, 1 - модератор, 2 - админ, 3 - суперадмин',
  `banned` tinyint(1) DEFAULT 0,
  `ban_date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `lastupdate` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `appearance` longtext DEFAULT NULL COMMENT 'Данные о внешности персонажа в формате JSON'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `email`, `isauth`, `access_level`, `isbanned`, `ban_reason`, `money`, `character_data`, `admin_level`, `banned`, `ban_date`, `lastupdate`, `appearance`) VALUES
(1, 'sadzorax', '$2a$10$B99MafwA3bE3fGP54TX.E.4SrvaBrz8sSmoExUMHkkjZhLufR9/Pm', 'lexus9209@gmail.com', 1, 10, 0, NULL, 100, NULL, 3, 0, '2025-01-03 15:53:50', '2025-01-03 15:53:50', NULL),
(2, 'Sx', '$2a$10$A1UFLHBb4sDflYBKvX0xo.IXo5mGpid2HZIRSsFjfG0a3HVLjjvmy', 'qwertyy34@bk.ru', 0, 10, 0, NULL, 82023980, NULL, 0, 0, '2025-01-03 13:33:06', '2025-01-03 14:04:40', NULL),
(4, 'TalkingBerry', '$2a$10$wCRQ4QqcPMNHA.PSRy2REObpaA/4CmcczpSOLUbBAxwxJSm8oAdh.', '1234@mail.ru', 0, 1, 0, NULL, 2147483647, NULL, 0, 0, '2025-01-03 13:33:06', '2025-01-03 14:04:40', NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `vehicles`
--

CREATE TABLE `vehicles` (
  `id` int(11) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `model` varchar(255) NOT NULL,
  `primary_color` int(11) NOT NULL,
  `secondary_color` int(11) NOT NULL,
  `mods` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`mods`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `hash` varchar(64) DEFAULT NULL,
  `plate` varchar(8) DEFAULT 'DRAIN'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `vehicles`
--

INSERT INTO `vehicles` (`id`, `owner_id`, `model`, `primary_color`, `secondary_color`, `mods`, `created_at`, `updated_at`, `hash`, `plate`) VALUES
(1, 1, 'elegyrh7', 38, 38, '{\"0\":10,\"1\":12,\"2\":5,\"3\":1,\"4\":2,\"6\":10,\"7\":6,\"8\":0,\"11\":3,\"12\":2,\"13\":2,\"14\":37,\"15\":2,\"16\":4,\"18\":0,\"22\":0,\"27\":6,\"33\":15,\"48\":30}', '2024-12-09 02:41:05', '2025-01-03 10:02:03', '2286990970', 'donked23'),
(2, 2, 'sunrise1', 111, 55, NULL, '2024-12-11 05:30:54', '2025-01-02 07:48:43', '376206035', 'DRAIN'),
(3, 2, 'zr380c', 0, 0, NULL, '2024-12-11 06:02:41', '2025-01-02 07:48:45', '781406351', 'DRAIN'),
(4, 2, 'roxanne', 0, 0, NULL, '2024-12-11 06:09:42', '2025-01-02 07:48:50', '4036327635', 'DRAIN'),
(5, 2, 'elegyrh7', 0, 0, NULL, '2024-12-11 07:37:10', '2025-01-02 07:48:53', '2286990970', 'DRAIN'),
(6, 4, 'sunrise1', 0, 0, NULL, '2025-01-02 03:05:54', '2025-01-02 03:05:54', '376206035', 'DRAIN'),
(7, 1, 'sunrise1', 38, 0, NULL, '2025-01-02 03:05:55', '2025-01-02 03:05:55', '376206035', 'DRAIN'),
(8, 4, 'roxanne', 0, 0, NULL, '2025-01-02 03:06:34', '2025-01-02 07:48:58', '4036327635', 'DRAIN'),
(9, 1, 'kawaii', 27, 0, NULL, '2025-01-02 03:06:43', '2025-01-02 03:06:43', '2210564613', 'DRAIN');

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `bank_cards`
--
ALTER TABLE `bank_cards`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `card_number` (`card_number`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_card_status` (`card_status`),
  ADD KEY `idx_total_transactions` (`total_transactions`),
  ADD KEY `idx_last_transaction` (`last_transaction_date`);

--
-- Индексы таблицы `bank_transactions`
--
ALTER TABLE `bank_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `card_id` (`card_id`),
  ADD KEY `idx_transaction_type` (`type`),
  ADD KEY `idx_transaction_date` (`created_at`),
  ADD KEY `idx_transaction_status` (`status_at_transaction`);

--
-- Индексы таблицы `characters`
--
ALTER TABLE `characters`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Индексы таблицы `houses`
--
ALTER TABLE `houses`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `house_garages`
--
ALTER TABLE `house_garages`
  ADD KEY `house_id` (`house_id`),
  ADD KEY `vehicle_id` (`vehicle_id`);

--
-- Индексы таблицы `locations`
--
ALTER TABLE `locations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Индексы таблицы `money_transactions`
--
ALTER TABLE `money_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_player` (`player_name`),
  ADD KEY `idx_timestamp` (`timestamp`);

--
-- Индексы таблицы `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Индексы таблицы `vehicles`
--
ALTER TABLE `vehicles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `owner_id` (`owner_id`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `bank_cards`
--
ALTER TABLE `bank_cards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT для таблицы `bank_transactions`
--
ALTER TABLE `bank_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT для таблицы `characters`
--
ALTER TABLE `characters`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT для таблицы `locations`
--
ALTER TABLE `locations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `money_transactions`
--
ALTER TABLE `money_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT для таблицы `vehicles`
--
ALTER TABLE `vehicles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Ограничения внешнего ключа сохраненных таблиц
--

--
-- Ограничения внешнего ключа таблицы `bank_cards`
--
ALTER TABLE `bank_cards`
  ADD CONSTRAINT `bank_cards_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Ограничения внешнего ключа таблицы `bank_transactions`
--
ALTER TABLE `bank_transactions`
  ADD CONSTRAINT `bank_transactions_ibfk_1` FOREIGN KEY (`card_id`) REFERENCES `bank_cards` (`id`);

--
-- Ограничения внешнего ключа таблицы `characters`
--
ALTER TABLE `characters`
  ADD CONSTRAINT `characters_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Ограничения внешнего ключа таблицы `house_garages`
--
ALTER TABLE `house_garages`
  ADD CONSTRAINT `house_garages_ibfk_1` FOREIGN KEY (`house_id`) REFERENCES `houses` (`id`),
  ADD CONSTRAINT `house_garages_ibfk_2` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`);

--
-- Ограничения внешнего ключа таблицы `vehicles`
--
ALTER TABLE `vehicles`
  ADD CONSTRAINT `vehicles_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
