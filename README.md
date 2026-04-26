## 3. Running Locally

You only need Docker installed. No need to run `npm install` or `npm run dev`.

```bash
git clone https://github.com/your-name/taskflow
cd taskflow

# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env

docker compose up --build