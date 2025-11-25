-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Lis 25, 2025 at 07:07 PM
-- Wersja serwera: 10.4.32-MariaDB
-- Wersja PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `findskills_dev`
--

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `chats`
--

CREATE TABLE `chats` (
  `id` int(11) NOT NULL,
  `participantA` int(11) NOT NULL,
  `participantB` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `chats`
--

INSERT INTO `chats` (`id`, `participantA`, `participantB`) VALUES
(5, 37, 38),
(6, 36, 38),
(7, 46, 51),
(8, 42, 46);

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `comments`
--

CREATE TABLE `comments` (
  `id` int(11) NOT NULL,
  `projectId` int(11) NOT NULL,
  `authorId` int(11) NOT NULL,
  `content` text NOT NULL,
  `timestamp` datetime NOT NULL,
  `parentId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `comments`
--

INSERT INTO `comments` (`id`, `projectId`, `authorId`, `content`, `timestamp`, `parentId`) VALUES
(94, 42, 42, 'A to ciekawe.', '2025-11-24 21:47:39', NULL),
(95, 42, 42, 'Czy trudno się tego nauczyć?', '2025-11-24 21:47:41', NULL),
(96, 42, 40, 'Na początku trzeba spędzić kilka godzin, ale później zaczyna się wszystko kojarzyć i idzie szybko :)', '2025-11-24 21:49:28', NULL),
(97, 40, 36, 'Super, chciałbym się zgłosić!', '2025-11-24 22:02:22', NULL),
(98, 40, 37, 'Ja też, wygląda świetnie', '2025-11-24 22:04:12', NULL),
(99, 40, 38, 'Doskonale!\nOgólnie to tydzień przed konkursem zostaną podane dodatkowe informacje i przykładowe zadania, wtedy napiszę o nich do was na czacie prywatnym.\nNa razie wejdźcie do regulaminów podanych w linku i upewnijcie się żeby dopełnić formalności!', '2025-11-24 22:07:24', NULL),
(100, 39, 41, 'Przyłączyłabym się, ale akurat tego dnia wyjeżdżam :(', '2025-11-24 22:10:33', NULL),
(101, 38, 43, 'A już myślałam, że nikt nie lubi fizyki. Przyłączę się, ale masz może jeszcze jakieś dobre zbiory zadań? Dobrze by było się poduczyć!', '2025-11-24 22:15:59', NULL),
(102, 38, 36, 'Sprawdź podlinkowaną stronę, tam już jest solidna porcja zadań!', '2025-11-24 22:23:48', NULL),
(103, 53, 39, 'To jest dla mnie idealne!', '2025-11-24 23:03:01', NULL),
(104, 53, 39, 'Kiedy to się odbywa?', '2025-11-24 23:03:24', NULL),
(105, 53, 45, 'No tak, zapomniałam ustawić terminu... 7 lutego 2026, jeszcze sporo czasu na przećwiczenie', '2025-11-24 23:04:20', NULL),
(106, 43, 46, 'Świetnie, chętnie wezmę udział!', '2025-11-25 15:36:10', NULL),
(107, 48, 50, 'Chciałbym się przyłączyć, efekt będzie super!', '2025-11-25 17:11:07', NULL),
(108, 48, 50, 'Rozumiem że robimy to w Angularze?', '2025-11-25 17:11:15', NULL),
(109, 67, 38, 'Super, mógłbym wziąć udział!', '2025-11-25 17:40:29', NULL),
(110, 66, 51, 'Ciekawy temat. Tylko w jakim to jest terminie?', '2025-11-25 17:47:10', NULL),
(111, 66, 46, 'Ach, zapomniałem go dodać. Trzeba wysłać do 18 stycznia 2026', '2025-11-25 17:48:12', NULL),
(112, 66, 46, 'Wysłałem ci na czacie prywatnym linka do pomocnych zasobów z których możemy korzystać przy tworzeniu', '2025-11-25 17:50:26', NULL),
(113, 66, 51, 'Super, sprawdzę. Mam nadzieję, że uda nam się to fajnie stworzyć!', '2025-11-25 17:51:15', NULL),
(114, 43, 46, 'Napiszę do ciebie na czacie prywatnym', '2025-11-25 17:54:14', NULL);

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `chatId` int(11) NOT NULL,
  `senderId` int(11) NOT NULL,
  `content` text NOT NULL,
  `timestamp` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `chatId`, `senderId`, `content`, `timestamp`) VALUES
(1, 5, 38, 'Cześć, chciałbym jeszcze dodać, że konkurs z matmy, do którego się przyłączyłaś odbędzie się w Liceum nr 1 w Warszawie', '2025-11-24 22:08:13'),
(2, 6, 38, 'Cześć, chciałbym jeszcze dodać, że konkurs z matmy, do którego się przyłączyłeś odbędzie się w Liceum nr 1 w Warszawie', '2025-11-24 22:08:29'),
(3, 7, 46, 'tu masz pomocnego linka do zasobów z których możemy korzystać przy tworzeniu prezentacji na Atomic Heroes', '2025-11-25 17:49:20'),
(4, 7, 46, 'https://hackheroes.pl', '2025-11-25 17:49:27'),
(5, 8, 46, 'To jaki mniej więcej masz pomysł na przygotowanie konkursu?', '2025-11-25 17:54:56'),
(6, 8, 42, 'Wyślę ci linka do fajnych zasobów do nauki', '2025-11-25 17:55:22'),
(7, 8, 42, 'https://example.com', '2025-11-25 17:55:25');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `profiles`
--

CREATE TABLE `profiles` (
  `id` int(11) NOT NULL,
  `schoolType` varchar(32) DEFAULT NULL,
  `favoriteSubjects` text DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `login` varchar(255) NOT NULL,
  `city` varchar(128) DEFAULT NULL,
  `schoolClass` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `profiles`
--

INSERT INTO `profiles` (`id`, `schoolType`, `favoriteSubjects`, `bio`, `passwordHash`, `login`, `city`, `schoolClass`) VALUES
(36, 'secondary', 'matematyka, fizyka', 'Jestem na rozszerzeniu z fizyki i matematyki. Szczególnie dobrze idą mi funkcje i astronomia.\n\nW wolnym czasie lubię jeździć na rowerze i czytać książki.', '$2a$08$V4XJhQ1Jr4IvZLSN3.2oKu3brc5NT/hTD.4nsblI4zlVSstJE/vFW', 'Michał123', 'Warszawa', 2),
(37, 'secondary', 'matematyka, j. angielski', 'Lubię matmę i potrafię mówić po angielsku na poziomie C1.\n\nW wolnym czasie lubię czytać książki i oglądać programy podróżnicze', '$2a$08$CSJyy8WAfAbZt.vvqDudUuaa6cXLZUGpfHNadasDPwBZpwQpqMrxS', 'Joanna2008', 'Warszawa', 3),
(38, 'secondary', 'matematyka', 'Umiem wszystko z matematyki co dotyczy szkoły średniej.\n\nPlanuję ją studiować!', '$2a$08$vabohxWccZ4CuS3D3aYTgOaAThN3.od7bsgxbhh4pF/CuNbDQKHOW', 'Matematyk25', 'Warszawa', 4),
(39, 'primary', 'plastyka, malarstwo, j. angielski', 'Lubię malować, szczególnie jeśli chodzi o impresjonizm. Umiem też wykonywać inne prace plastyczne, np. lepienie z gliny. Dobrze radzę sobie też z angielskim', '$2a$08$X666rRcyFICW1WmuahN.1eeI7fowJu3G.GPLFUPlc56D.wNg4x9vK', 'Artysta321', 'Warszawa', 7),
(40, 'primary', 'robotyka, matematyka', 'Kocham matmę i robotykę. Mam w domu Arduino. Wbrew temu, co mówi moja nazwa użytkownika, potrafię przejść CAPTCHA :)', '$2a$08$b1BX.IXxP1Pm4QwVKDvvHe0bmXhrT2Kna8eqzLCQRKb/RyZBBfhHS', 'JestemRobotem', 'Warszawa', 8),
(41, 'secondary', 'j. angielski, j. niemiecki, grafika komputerowa', 'Lubię uczyć się języków. Umiem angielski, niemiecki i słabiej hiszpański.\nPoza tym lubię przygotowywać grafiki na komputerze. Dużo pracowałam w GIMPie i często robię to w wolnym czasie', '$2a$08$0rYoF7182e5F07D.qFjP1uRdoHAxMQONB6gO6sdrPkRRJmJw0QVf6', 'Kasia', 'Warszawa', 1),
(42, 'primary', 'fizyka', 'Lubię fizykę, potrafię zrobić również podstawowe rzeczy z obwodami elektrycznymi.\nChciałbym się niedługo nauczyć czegoś z robotyki.', '$2a$08$7t4DOE4WeXW8RLf/WVdlMeHcBZJediI40VAijQ5VCVmfFz68Fx/Xu', 'MarekFizyczny', 'Warszawa', 8),
(43, 'secondary', 'j. hiszpański, fizyka, komponowanie muzyki', 'Dobrze umiem hiszpański i uwielbiam fizykę. W wolnym czasie lubię również słuchać muzyki i komponować muzykę - wiem, to nietypowe połączenie ulubionych zajęć!', '$2a$08$Yxllxm1CnhqI4Ia884p8N.pUF/D0lY/xw55IdO2.9lD2mj86QjvuK', 'Fiz_Wiktoria', 'Warszawa', 3),
(44, 'secondary', 'programowanie, web development', 'Znam HTML, CSS i JavaScript i kocham robić aplikacje webowe w Angularze.\nPoza tym znam mniej-więcej Nest.js oraz C#', '$2a$08$X73qXQYRkGGQo3kkq.MqvuAzanmZLhWKkM1V6NfWGl8UzhJcVxc2m', 'Angularowiec', 'Warszawa', 4),
(45, 'primary', 'geografia, j. angielski', 'Lubię poznawać mapę świata oraz doskonalić angielski. Kocham podróże.', '$2a$08$61reijW.TMrGxwMOHocpMeoBvRsLbQsjOfAh5aJHPYYjgi4CxW30q', 'Paulina1', 'Warszawa', 7),
(46, 'primary', 'fizyka, biologia', 'Lubię fizykę oraz biologię, szczególnie optykę oraz genetykę. Poza tym, lubię jeździć na nartach', '$2a$08$yacVDYDWEgxAz44w1nhQQOBkPHl6jYCtLtBP3hXTWJfZOIwMfPyK2', 'Kacper44', 'Katowice', 8),
(47, 'secondary', 'informatyka, programowanie, robotyka', 'Kocham hackathony i Arduino', '$2a$08$hGm.LAEwNVsNwpIEW9Ak1uzBEWFNHT2HQy9tZBstOsksOM5NLRMvW', 'Procesor0101', 'Katowice', 3),
(48, 'secondary', 'biologia, chemia', 'Kocham eksperymenty chemiczne. Mam kilka terrariów z małymi stworzonkami', '$2a$08$cU5dRBnRV058gay8xxTbHOchXnZtzpZIvcyLKXEgA2mI8jxm9i2g.', 'Biochemik99', 'Katowice', 4),
(49, 'primary', 'biologia, geografia, strony internetowe', 'Lubię naturę i uczenie się o różnych regionach geograficznych. Umiem HTML i CSS.', '$2a$08$dyeGHWVashgxAz3zT2qHeOyS7h1FKSPCbFoXyoTlRScxIJl/R57QS', 'Krystyna48', 'Katowice', 7),
(50, 'secondary', 'programowanie, javascript', 'Umiem bardzo dużo rzeczy jeśli chodzi o JavaScript - frontendy, backendy, Angular, Nest, React, Express, Vue', '$2a$08$zvQtIG1LpCojPEeoK2eRj.Ufj5rJ1RAWa2Q8CILkvUpFAzadmc.qO', 'JavaScripter', 'Katowice', 1),
(51, 'primary', 'historia, fizyka', 'Lubię uczyć się o przeszłości, bo jest ona połączona z teraźniejszością. Poza tym dobrze mi idzie fizyka. W wolnym czasie lubię grać w kręgle', '$2a$08$h2073qCMINaIJdTYRK2/C.XatLmsXC7WN9nWtwlgYdDhECQ/suHJG', 'Maria', 'Katowice', 8);

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `projects`
--

CREATE TABLE `projects` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `remote` tinyint(1) NOT NULL DEFAULT 0,
  `authorId` int(11) DEFAULT NULL,
  `schoolType` varchar(32) DEFAULT NULL,
  `beginDate` datetime DEFAULT NULL,
  `endDate` datetime DEFAULT NULL,
  `minPeople` int(11) DEFAULT NULL,
  `maxPeople` int(11) DEFAULT NULL,
  `currentPeople` int(11) DEFAULT NULL,
  `subject` varchar(128) NOT NULL,
  `type` varchar(32) NOT NULL,
  `link` varchar(255) DEFAULT NULL,
  `city` varchar(128) DEFAULT NULL,
  `schoolClass` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`id`, `name`, `description`, `remote`, `authorId`, `schoolType`, `beginDate`, `endDate`, `minPeople`, `maxPeople`, `currentPeople`, `subject`, `type`, `link`, `city`, `schoolClass`) VALUES
(38, 'Star Brains 2026', 'Konkurs astronomiczny Star Brains 2025. Temat konkursu obejmuje m.in. obliczenia dotyczące grawitacji oraz ruchów ciał niebieskich. Konkurs jest dla szkół średnich i można go robić w grupie do 3 osób.', 0, 36, 'secondary', '2026-01-20 00:00:00', NULL, 1, 3, 1, 'Fizyka', 'competition', 'https://example.com', 'Warszawa', 2),
(39, 'English Speakers', 'Wojewódzki Konkurs z języka angielskiego, można wygrać wyjazd do Wielkiej Brytanii!', 0, 37, 'secondary', '2025-12-19 00:00:00', NULL, 1, 5, 1, 'j. angielski', 'competition', 'http://example.com', 'Warszawa', 3),
(40, 'European Math Masters', 'Europejski konkurs z matematyki dla szkół średnich. Potrzeba trzyosobowej grupy! Polscy uczniowie piszą go w Warszawie', 0, 38, 'secondary', '2026-01-05 00:00:00', NULL, 3, 3, 1, 'Matematyka', 'competition', 'http://example.org', 'Warszawa', 4),
(41, 'Cyfrowe obrazy', 'Chciałbym wykonać obrazy komputerowe, ale nie mam sporo doświadczenia z programami graficznymi. Chciałbym znaleźć kogoś, kto lubi ten temat i nieco lepiej zna się na grafice komputerowej. Mam nadzieję, że uda nam się razem stworzyć coś fajnego!', 1, 39, 'primary', NULL, NULL, NULL, NULL, 1, 'Grafika komputerowa', 'project', NULL, 'Warszawa', 7),
(42, 'MEGA Robot', 'Chciałbym wykonać projekt robota. Mam wszystkie potrzebne rzeczy, ale ten projekt będzie wyjątkowo zaawansowany, a razem pracuje się lepiej', 0, 40, 'primary', NULL, NULL, NULL, NULL, 1, 'Robotyka', 'project', NULL, 'Warszawa', 8),
(43, 'Fizyka bez tajemnic 2025', 'Zdalny konkurs dla szkół podstawowych z fizyki', 1, 42, 'primary', '2025-12-11 00:00:00', NULL, NULL, 2, 1, 'Fizyka', 'competition', 'http://example.org', NULL, 8),
(44, 'DoubleTalk', 'Konkurs z angielskiego, gdzie startuje się jako dwuosobowe pary i trzeba spontanicznie poprowadzić płynną rozmowę na zadany temat', 0, 41, 'secondary', '2026-01-15 00:00:00', '2026-01-15 00:00:00', 2, 2, 1, 'j. angielski', 'competition', 'http://example.org', 'Warszawa', 1),
(45, 'Piosenki relaksacyjne', 'Chciałabym stworzyć kilka utworów komputerowej muzyki relaksacyjnej. Jeszcze takiej nie tworzyłam, więc przyda się ktoś, kto również lubi komponować i miał więcej do czynienia z tym typem. Projekty możemy opublikować na jakimś wspólnym profilu.', 1, 43, 'secondary', NULL, NULL, NULL, NULL, 0, 'Komponowanie, muzyka', 'project', NULL, 'Warszawa', 3),
(46, 'Spanish Masters', 'Grupowy, zdalny konkurs z języka hiszpańskiego', 1, 43, 'secondary', '2025-12-20 00:00:00', NULL, NULL, 3, 0, 'j. hiszpański', 'competition', NULL, 'Warszawa', 3),
(47, 'Hackathon HackHeroes 2025', 'Zdalny hackathon HackHeroes gdzie zadaniem jest stworzyć w dwa tygodnie aplikację. Temat zostanie ujawniony w dniu rozpoczęcia konkursu. Prawdopodobnie będę robił aplikację webową - jeśli umiesz webowy frontend lub backend, pisz!', 1, 44, 'secondary', '2025-11-10 00:00:00', '2025-11-25 00:00:00', NULL, NULL, 1, 'Programowanie', 'competition', 'https://www.hackheroes.pl/', NULL, 4),
(48, 'Webowy komunikator', 'Chciałbym stworzyć aplikację webową - komunikator - ale to całkiem spore zadanie. Jeśli umiesz frontendy lub backendy, możemy wykonać projekt razem!', 1, 44, 'secondary', NULL, NULL, NULL, NULL, 1, 'Programowanie', 'project', NULL, NULL, 4),
(53, 'Art Description Contest', 'Ten nietypowy konkurs polega na opisywaniu różnych dzieł sztuki po angielsku - wymaga znajomości wielu słów odnoszących się do wyglądu i emocji', 1, 45, 'primary', NULL, NULL, 2, 4, 2, 'Język angielski', 'competition', 'http://example.com', NULL, 7),
(54, 'Konkurs geograficzny POLGEO', 'Konkurs dotyczy wiedzy z geografii, głównie z geologii Polski', 0, 45, 'primary', NULL, NULL, NULL, NULL, 0, 'Geografia', 'competition', NULL, 'Warszawa', 7),
(55, 'Mistrzowie Origami', 'Konkurs polega na stworzeniu jak największego i najpiękniejszego tworu Origami w 2 osoby', 0, 39, 'primary', '2026-02-11 00:00:00', NULL, 2, 2, 1, 'Plastyka', 'competition', 'https://example.com', 'Warszawa', 7),
(56, 'Plant Masters 2026', 'Konkurs z biologii dotyczący głównie wiedzy o roślinach dla klas 8 szkół podstawowych', 0, 46, 'primary', '2026-01-25 00:00:00', NULL, NULL, 3, 2, 'Biologia', 'competition', 'https://example.org', 'Katowice', 8),
(57, 'Hackathon CyberMasters', 'Celem hackathonu jest stworzenie gry w Unity lub Godot, której temat zostanie podany dopiero po rozpoczęciu konkursu. Hackathon jest zdalny, trzydniowy i dostępny dla wszystkich uczniów szkół średnich. Mam już dwie inne osoby, ale może być nas aż pięciu', 1, 47, 'secondary', '2026-02-23 00:00:00', '2026-02-26 00:00:00', NULL, 5, 3, 'Programowanie', 'competition', 'http://example.org', 'Katowice', 3),
(58, 'Gra w Unity', 'Planuję zrobić platformera 3D w Unity. To spore zadanie więc przyda się ktoś do pomocy. Potrzeba kodu C# i modeli 3D. ', 1, 47, 'secondary', NULL, NULL, 1, 4, 1, 'Programowanie, modelowanie', 'project', NULL, 'Katowice', 3),
(59, 'Ulepszone terrarium', 'Chciałbym zrobić ulepszone terrarium z ogrzewaniem i małymi roślinami', 0, 48, 'secondary', NULL, NULL, NULL, NULL, 2, 'Biologia', 'project', NULL, 'Katowice', 4),
(60, 'Otoczeni chemią', 'Konkurs chemiczny polegający na przygotowaniu filmu skupiającego się na właściwościach pierwiastków i związków chemicznych z którymi stykamy się na co dzień w domu.\nFilmik każdy może wykonać w swoim domu i przesłać fragmenty na odległość - ja wtedy wszystko skleję. Konkurs dla klas czwartych szkół średnich ', 1, 48, 'secondary', NULL, NULL, NULL, NULL, 0, 'Chemia', 'competition', 'https://example.org', 'Katowice', 4),
(61, 'Aplikacja webowa o Polsce', 'Chciałabym wykonać aplikację webową z mapą polski i informacjami o poszczególnych regionach, ale słabo mi idą skrypty i potrzebuję współpracownika', 1, 49, 'primary', NULL, NULL, NULL, 4, 2, 'Geografia, programowanie', 'project', NULL, 'Katowice', 7),
(62, 'Bioróżnorodni', 'Konkurs z biologii skupiający się na bioróżnorodności wśród gatunków', 0, 49, 'primary', NULL, NULL, 2, 5, 1, 'Biologia', 'competition', 'https://example.com', 'Katowice', 7),
(63, 'Hackathon HackHeroes 2026', 'Robimy aplikację webową w Angular i Nest, która będzie wspomagać edukację i rozwój talentów poprzez ułatwienie znalezienia rówieśników o podobnych zainteresowaniach, z którymi można wykonać fajne projekty bądź wziąć udział w konkursie', 1, 50, 'secondary', '2026-11-10 00:00:00', '2026-11-25 00:00:00', NULL, NULL, 2, 'Programowanie', 'competition', NULL, 'Katowice', 1),
(64, 'HistMax 2026', 'Konkurs z historii w ramach którego trzeba zrobić w grupach film omawiający wybraną epokę historyczną. Konkurs dla klas 8 szkoły podstawowej', 1, 51, 'primary', '2026-01-02 00:00:00', '2026-01-07 00:00:00', 3, 4, 2, 'Historia', 'competition', 'https://example.org', 'Katowice', 8),
(65, 'Makieta historyczna', 'Chciałabym wykonać makietę prezentującą średniowieczny zamek i wiernie oddającą jego konstrukcję', 0, 51, 'primary', NULL, NULL, NULL, NULL, 0, 'Historia, plastyka', 'project', NULL, 'Katowice', 8),
(66, 'Atomic Heroes', 'Konkurs dla szkół podstawowych polegający na przygotowaniu prezentacji opisującej działanie elektrowni atomowej', 1, 46, 'primary', NULL, NULL, NULL, NULL, 0, 'Fizyka', 'competition', 'https://example.org', 'Katowice', 8),
(67, 'Gigamatematycy 2026', 'Konkurs z matematyki w którym można uczestniczyć w dwuosobowych grupach', 0, 36, 'secondary', '2026-06-03 00:00:00', NULL, NULL, 2, 1, 'Matematyka', 'competition', 'https://example.com', 'Warszawa', 2),
(68, 'Model atomu w 3D', 'Model atomu w 3D który będzie można obejrzeć z każdej strony i zobaczyć, jak poruszają się elektrony', 1, 51, 'primary', NULL, NULL, 2, 2, 1, 'Fizyka, modele 3D', 'project', NULL, 'Katowice', 8);

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `webauthn_credentials`
--

CREATE TABLE `webauthn_credentials` (
  `id` int(11) NOT NULL,
  `profileId` int(11) DEFAULT NULL,
  `login` varchar(255) NOT NULL,
  `credential_id` varchar(512) NOT NULL,
  `public_key` longblob NOT NULL,
  `counter` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `webauthn_credentials`
--

INSERT INTO `webauthn_credentials` (`id`, `profileId`, `login`, `credential_id`, `public_key`, `counter`, `created_at`, `updated_at`) VALUES
(1, 41, 'kasia', '6s-MkFKDV7Y71TEXyJrcgyZU53rcn1UzIJElul2SH-E', 0xa501020326200121582023b8df2783737ab3b575213d0e5e6d2d73a44da8cce34b5c67cbf10e7ac345a3225820bd930b2e12f2911a9d1a7c6ca6af2bbf249803f5973230bf5c8e1bebe232614c, 2, '2025-11-25 15:08:09', '2025-11-25 15:08:27');

--
-- Indeksy dla zrzutów tabel
--

--
-- Indeksy dla tabeli `chats`
--
ALTER TABLE `chats`
  ADD PRIMARY KEY (`id`);

--
-- Indeksy dla tabeli `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_266dea9aee3073a8a5e4d92845f` (`projectId`);

--
-- Indeksy dla tabeli `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_36bc604c820bb9adc4c75cd4115` (`chatId`);

--
-- Indeksy dla tabeli `profiles`
--
ALTER TABLE `profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `IDX_babd0b2b45c50e9780d1bf6aab` (`login`);

--
-- Indeksy dla tabeli `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_284d88f48163afb6eea98c8b0fc` (`authorId`);

--
-- Indeksy dla tabeli `webauthn_credentials`
--
ALTER TABLE `webauthn_credentials`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `IDX_8292f27b760a80388601db2d42` (`credential_id`),
  ADD KEY `IDX_88a60745cea3b323066d1fdb42` (`login`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `chats`
--
ALTER TABLE `chats`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `comments`
--
ALTER TABLE `comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=115;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `profiles`
--
ALTER TABLE `profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=69;

--
-- AUTO_INCREMENT for table `webauthn_credentials`
--
ALTER TABLE `webauthn_credentials`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `comments`
--
ALTER TABLE `comments`
  ADD CONSTRAINT `FK_266dea9aee3073a8a5e4d92845f` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `FK_36bc604c820bb9adc4c75cd4115` FOREIGN KEY (`chatId`) REFERENCES `chats` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Constraints for table `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `FK_284d88f48163afb6eea98c8b0fc` FOREIGN KEY (`authorId`) REFERENCES `profiles` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
