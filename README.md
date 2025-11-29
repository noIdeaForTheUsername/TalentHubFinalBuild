Nazwaliśmy to błędnie "build" ale właściwie jest to kod źródłowy. Nie zmieniamy nazwy, żeby nie zepsuć przesłanego linku.
Frontend w "FindSkillsFront", Backend w "find-skills-backend".

Użyte technologie: Angular (frontend), Angular Material (część elementów UI frontendu), Nest (backend), MariaDB (baza danych). Hosting na własnym Raspberry Pi z Apache.

Dodatkowo, wykorzystane nietypowe technologie: Logowanie kluczem dostępu dzięki WebAuthn (biblioteka SimpleWebAuthn).
Aby przetestować, zaloguj się, przejdź na stronę "Profil i konto" i kliknij przycisk "Dodaj klucz dostępu". Potrzebujesz klucza sprzętowego lub aktywowanego kodu PIN Windows Hello.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
WŁASNY DEPLOY:
1. Wymagane: zainstalowane Node.js oraz Angular CLI (https://angular.dev/tools/cli/setup-local), a także MariaDB

2. Zaimportować findskills_dev.sql do MariaDB do bazy danych o nazwie "findskills_dev"
3. Wymagane utworzenie użytkownika w bazie danych: "findskills_user" o haśle "findskills_pass". Do celów testowych zalecamy nie zmieniać konfiguracji.
GOTOWIEC DO 2 i 3:
CREATE DATABASE IF NOT EXISTS `findskills_dev` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'findskills_user'@'localhost' IDENTIFIED BY 'findskills_pass';
GRANT ALL PRIVILEGES ON `findskills_dev`.* TO 'findskills_user'@'localhost';
FLUSH PRIVILEGES;
*Jeśli to konieczne, można modyfikować parametry bazy danych backendu poprzez zmienne środowiskowe używane przez backend. Nazwy zmiennych i domyślne wartości:
DB_HOST=localhost
DB_PORT=3306
DB_USER=findskills_user
DB_PASSWORD=findskills_pass
DB_NAME=findskills_dev

4. Skompilować wersję produkcyjną frontendu: "npm install", a potem "ng build" wywołane w folderze FindSkillsFront (używa Angular CLI). Otrzymane pliki w folderze "dist" muszą być zwracane przez webserver.
   Każdy route (URL) musi kierować do pliku index.html - Angular sam zarządza routingiem po stronie klienta.
   Więcej informacji w oficjalnej dokumentacji Angulara: https://angular.dev/tools/cli/deployment#manual-deployment-to-a-remote-server

5. !!! W pliku index.html otrzymanym w wyniku buildu backendu należy zmienić 2 rzeczy:
  A. URL do serwera backendowego (nie lokalny, tylko "względem klienta" - przeglądarka użytkownika będzie wysyłać zapytania na ten adres). Np.:
    ```<script>
      window.__APP_CONFIG__ = {
        api_url: 'https://chmuraim.dynv6.net:4430',  // <---- TU! NIE ZOSTAWIAJ / NA KOŃCU!
      };
    </script>
    ```
    Kod klienta automatycznie dokleja "/api/..." do tego URL. Ścieżki zaczynające się od "/api" powinny być kierowane do endpointów serwera zamiast do index.html.
    Uwaga: wszystkie endpointy zdefiniowane na serwerze faktycznie zaczynają się już od "/api/...". Ten fragment nie powinien być "ucinany" np. po przejściu przez reverse proxy
  B. Base URL:
    ```<base href="/">```
    W miejscu "href" podajemy route głównej ścieżki widoczny w przeglądarce. Np. jeśli nie hostujemy strony głównej na ścieżce root (/), tylko adres
    głównej strony to np. https://przemekgrabecki.ddns.net/FindSkillsFront/browser/, to wstawiamy ```<base href="/FindSkillsFront/browser/">```. Stamtąd przeglądarka będzie pobierać np. CSS i grafiki.

6. Aby uruchomić serwer w trybie produkcyjnym, uruchamiamy w find-skills-backend: "npm install --only=prod", "npm run build", dostajemy skompilowany folder "dist".
   Kopiujemy "dist" oraz "package.json" na serwer. Najlepiej dać oba z nich OBOK SIEBIE w tej samej lokalizacji. W tej lokalizacji (z package.json oraz resztą plików w ./dist/...) uruchamiamy:
   npm run start:prod
   Domyślny port to 3000 (localhost).

