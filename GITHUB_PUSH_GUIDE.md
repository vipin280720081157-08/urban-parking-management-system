# SmartPark — GitHub Push Guide

## 1. Push the code
Create an empty repository named `urban-parking-management-system` on GitHub (no README, no .gitignore), make sure your SSH key is added to GitHub, then run:

```bash
cd "C:\path\to\urban-parking-management-system"

git init
git config user.name "Vipin28"
git config user.email "Vipin280720081157@gmail.com"

git add .
git commit -m "Initial commit: SmartPark full stack project"

git branch -M main
git remote add origin git@github.com:vipin280720081157-08/urban-parking-management-system.git
git push -u origin main
```

## 2. Enable GitHub Pages
1. Open the repository → **Settings** → **Pages**.
2. **Source:** Deploy from a branch.
3. **Branch:** `main` — **Folder:** `/docs` → **Save**.
4. Wait about one minute. The site goes live at
   https://vipin280720081157-08.github.io/urban-parking-management-system/

The hosted site runs in MOCK mode automatically (no backend needed).

## 3. Update later
```bash
git add . && git commit -m "update" && git push
```
Pages redeploys within a minute or two.

## 4. Check that Pages is live
- Settings → Pages shows "Your site is live at …".
- The **Actions** tab shows a green "pages build and deployment" run.
- Open the URL in a private window. If you see an old version, hard-refresh with Ctrl + Shift + R.
- If you get a 404, confirm the folder is `/docs` and that `docs/index.html` exists on `main`.
