-- SQL script pentru initializarea bazei de date PETHUB si a tabelului de produse
-- Utilizare: mysql -u root -p < db/init_baza_produse.sql

CREATE DATABASE IF NOT EXISTS `pethub` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'pethub_user'@'localhost' IDENTIFIED BY 'PethubPass123!';
GRANT SELECT ON `pethub`.* TO 'pethub_user'@'localhost';
FLUSH PRIVILEGES;

USE `pethub`;

DROP TABLE IF EXISTS `produse`;
CREATE TABLE `produse` (
  `id` INT NOT NULL PRIMARY KEY,
  `nume` VARCHAR(255) NOT NULL,
  `descriere` TEXT,
  `imagine` VARCHAR(255),
  `categorie_mare` ENUM('Caini', 'Pisici', 'Pesti', 'Rozatoare', 'Reptile') NOT NULL,
  `subcategorie` VARCHAR(100) NOT NULL,
  `pret` DECIMAL(10,2) NOT NULL,
  `cantitate` INT NOT NULL,
  `data_adaugare` DATE NOT NULL,
  `culoare` VARCHAR(50) NOT NULL,
  `ingrediente` TEXT,
  `livrare_posta` BOOLEAN NOT NULL DEFAULT FALSE,
  `producator` VARCHAR(100),
  `tara_origine` VARCHAR(100),
  `promotie` VARCHAR(255),
  `garantie` VARCHAR(50),
  `recomandat` VARCHAR(255),
  `specificatii` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `produse` (`id`, `nume`, `descriere`, `imagine`, `categorie_mare`, `subcategorie`, `pret`, `cantitate`, `data_adaugare`, `culoare`, `ingrediente`, `livrare_posta`, `producator`, `tara_origine`, `promotie`, `garantie`, `recomandat`, `specificatii`) VALUES
(1, 'Hrana uscata premium pentru caini adulti', 'Formula completa pentru caini adulti care sustine digestia si musculatura activa.', '/resurse/imagini/produse/hrana_caini_5kg.jpg', 'Caini', 'Adult', 189.00, 7500, '2025-09-15', 'Maro', 'pui, orez, fibre naturale, vitamine, minerale', TRUE, 'PetHub Premium', 'Romania', '5% reducere abonament lunar', '24 luni', 'Caini adulti rasa medie si mare, cu activitate normala.', 'Fara coloranti artificiali, Proteine 26%, Fibre 4%, Omega 3 si 6'),
(2, 'Jucarie minge rezistenta pentru caini', 'Minge rezistenta pentru fetch si antrenamente, fabricata din cauciuc natural.', '/resurse/imagini/produse/minge_caini.jpg', 'Caini', 'Accesorii', 35.00, 200, '2025-10-01', 'Portocaliu', 'cauciuc natural, vopsea non-toxica', TRUE, 'TuffPlay', 'Germania', 'Livrare gratuita la comanda de peste 200 lei', '12 luni', 'Caini activi care iubesc mestecatul si fetch-ul.', 'Diametru 8 cm, Rezistenta la muscaturi, Inotabila, Culoare portocalie'),
(3, 'Patura soft pentru caini mici', 'Patura calda si lavabila, ideala pentru caini mici si de talie mica.', '/resurse/imagini/produse/patura_caini.jpg', 'Caini', 'Talie mici', 89.00, 1200, '2025-08-10', 'Bej', 'microfibra, umplutura poliester', TRUE, 'CozyPaws', 'Romania', 'Curatare gratuita pentru primele 30 de zile', '18 luni', 'Caini de talie mica care doresc un somn confortabil.', 'Material hipoalergenic, Intretinere usoara, Dimensiune 90x60 cm'),
(4, 'Litiera automata pentru pisici', 'Litiera cu curatare automata si filtru carbon activ pentru miros controlat.', '/resurse/imagini/produse/litiera_pisici.jpg', 'Pisici', 'Igiena', 62.00, 10, '2025-11-03', 'Alb', 'ABS, filtru carbon, plasma ionica', TRUE, 'CleanPet', 'Olanda', 'Kit de curatare gratuit inclus', '18 luni', 'Pisici de apartament activi si familii care doresc confort sporit.', 'Filtru carbon activ, Senzor de prezenta, Curatare automata, Capacitate 10 L'),
(5, 'Hrana umeda pisici junior', 'Pachete hranitoare cu pui si vita, vitala pentru pisici tinere.', '/resurse/imagini/produse/hrana_pisici.jpg', 'Pisici', 'Junior', 16.00, 1020, '2025-09-28', 'Rosu', 'pui, vita, extracte de legume, vitamine', TRUE, 'Felix Gourmet', 'Danemarca', '2 pachete gratis la 5 cumparate', '12 luni', 'Pisici tinere cu necesitati de crestere si energie.', 'Fara conservanti, Vitamine esentiale, Textura moale, Aroma pui-vita'),
(6, 'Scratcher confort pentru pisici', 'Jucarie-scratch pentru pisici cu suprafata din carton si plasa de iuta.', '/resurse/imagini/produse/scratcher_pisici.jpg', 'Pisici', 'Accesorii', 49.00, 1800, '2025-09-20', 'Bej', 'carton, iuta, lemn', TRUE, 'ScratchMate', 'Germania', 'Transport gratuit din stoc', '24 luni', 'Pisici care au nevoie de un loc stabil pentru ungerea ghearelor.', 'Suprafata dubla, Suprafete flexibile, Design compact, Usor de asamblat'),
(7, 'Acvariu starter kit 80L', 'Acvariu complet cu filtru si incalzitor, ideal pentru pesti tropicali mici.', '/resurse/imagini/produse/acvariu_80l.jpg', 'Pesti', 'Habitat', 245.00, 80000, '2025-10-12', 'Transparent', 'sticla securizata, filtru extern, incalzitor', FALSE, 'AquaLife', 'Belgia', 'Pachet complet cu filtru si incalzitor', '24 luni', 'Acvariu pentru pesti tropicali mici si comunitati mixte.', 'Sticla securizata, Filtru extern 200L/h, Incalzitor 100W, Dimensiuni 80x35x40 cm'),
(8, 'Filtru acvariu premium', 'Filtru extern performant pentru acvarii de pana la 100L.', '/resurse/imagini/produse/filtru_acvariu.jpg', 'Pesti', 'Intretinere', 189.00, 1200, '2025-09-05', 'Negru', 'plastic ABS, ceramica bio, cartus carbon', FALSE, 'PureFlow', 'Tarile de Jos', 'Reducere 10% la pachete multiple', '24 luni', 'Acvariu pentru intretinere eficienta si apa clara.', 'Consum redus, Curatare usoara, Filtrare mecanica si biologica'),
(9, 'Cusca rozatoare deluxe', 'Cusca spatioasa cu platforme si tava detasabila.', '/resurse/imagini/produse/cusca_rozatoare.jpg', 'Rozatoare', 'Habitat', 138.00, 2800, '2025-11-17', 'Gri', 'metal, tabla vopsita, plastic', TRUE, 'SmallPet', 'Polonia', 'Set de accesorii cadou', '12 luni', 'Rozatoare mici care au nevoie de spatiu si acces rapid la hrana.', 'Tava detasabila, Rampa inclusa, Ventilatie buna, Compartiment superior'),
(10, 'Mix hrana pentru hamsteri', 'Hranire echilibrata pentru hamsteri adulti cu seminte si vitamine.', '/resurse/imagini/produse/hrana_hamster.jpg', 'Rozatoare', 'Alimentatie', 29.00, 900, '2025-10-22', 'Maro', 'seminte de floarea-soarelui, ovaz, vitamine, mineral', TRUE, 'HappyHamster', 'Romania', 'Paua de transport sub 24h', '12 luni', 'Hamsteri adulti care au nevoie de hrana bogata in fibre.', 'Seminte selectate, Vitamine B, Minerale, Fara zahar adaugat'),
(11, 'Terrarium reptile 60L', 'Terrarium cu iluminare si capac de ventilatie pentru reptile.', '/resurse/imagini/produse/terrarium_60l.jpg', 'Reptile', 'Habitat', 390.00, 60000, '2025-08-30', 'Negru', 'sticla, plastic ABS, metal', FALSE, 'ReptiZone', 'Italia', 'Livrare speciala in 48h', '24 luni', 'Terariu pentru reptile care necesita temperatura controlata.', 'Capac ventilatie, Iluminare inclusa, Design modern, Sticla securizata'),
(12, 'Set incalzitor pentru reptile', 'Incalzitor reglabil pentru terarii mici si medii.', '/resurse/imagini/produse/incalzitor_reptile.jpg', 'Reptile', 'Accesorii', 78.00, 350, '2025-10-01', 'Alb', 'plastic, ceramica, cablu', TRUE, 'HeatNest', 'SUA', 'Transport gratuit la 2 bucati', '18 luni', 'Reptile care au nevoie de sursa de caldura stabila.', 'Reglabil 25-35°C, Protectie supraincalzire, Cablu 1.5m'),
(13, 'Caine de plus interactiv', 'Jucarie de plus pentru copii si animale de companie.', '/resurse/imagini/produse/jucarie_plush.jpg', 'Caini', 'Jucarii', 55.00, 450, '2025-09-02', 'Bej', 'textil, umplutura vatelina, sunet', TRUE, 'PlayPet', 'Romania', '2 ani garantie defecte', '24 luni', 'Caini de plus si copii care adora jucariile interactive.', 'Sunet integrat, Material moale, Compatibil spalare manuala'),
(14, 'Perie profesionala pentru pisici', 'Perie pentru blana lunga, reduce parul mobil.', '/resurse/imagini/produse/perie_pisici.jpg', 'Pisici', 'Ingrijire', 42.00, 120, '2025-09-18', 'Albastru', 'plastic, otel inoxidabil', TRUE, 'GroomEase', 'Canada', 'Pachet promo pentru mai multe produse', '12 luni', 'Pisici cu blana lunga si piele sensibila.', 'Perii din otel inoxidabil, Maner ergonomic, Efect anti-soc, Curatare usoara'),
(15, 'Minge acvariu decorativa', 'Decor pentru acvariu cu iepurasi mov si plante artificiale.', '/resurse/imagini/produse/decor_acvariu.jpg', 'Pesti', 'Decor', 25.00, 300, '2025-10-05', 'Violet', 'plastic, silicon, vopsea non-toxica', TRUE, 'AquaDesign', 'Franta', 'Livrare in 2 zile lucratoare', '12 luni', 'Pesti care traiesc intr-un acvariu colorat si sigur.', 'Silicon non-toxic, Culori rezistente, Design stabil'),
(16, 'Bancheta de lemn pentru rozatoare', 'Platforma si trepte din lemn natural pentru hamsteri si soareci.', '/resurse/imagini/produse/bancheta_rozatoare.jpg', 'Rozatoare', 'Accesorii', 52.00, 700, '2025-11-01', 'Natural', 'lemn, sfoara, lipici non-toxic', TRUE, 'WoodNest', 'Germania', 'Cadou folie protectoare', '12 luni', 'Rozatoare care adora sa rontaie si sa escaladeze.', 'Lemn natural, Trepte incluse, Fixare usoara');
