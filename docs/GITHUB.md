# Publish Fleetly to GitHub

Follow these steps once this folder is named `fleetly` and you are ready to push it as its own repository.

## 1. Prepare locally

- Ensure **`.env` is not committed** (it is listed in `.gitignore`). Use **`.env.example`** only in the repo.
- Run `npm run lint` and `npm run build` before pushing.

## 2. Create an empty repository on GitHub

1. Open [github.com/new](https://github.com/new).
2. Choose a name (e.g. `fleetly`).
3. Leave **“Add a README”** unchecked if you will push an existing project.
4. Create the repository.

## 3. Initialize Git and push (first time)

From the **`fleetly/`** directory (this project root):

```bash
cd /path/to/fleetly

git init
git add .
git commit -m "Initial commit: Fleetly Traccar UI"

git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your GitHub user and repository name.

If GitHub shows instructions with a different default branch name, use that branch or stick with `main` as above.

### SSH instead of HTTPS

```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

## 4. Later updates

```bash
git add .
git commit -m "Describe your change"
git push
```

## Optional: publish only this folder from a monorepo

If `fleetly` lives inside a larger workspace, either:

- **Copy** the `fleetly/` tree into a new folder and run the steps above, or  
- Use **[git subtree split](https://www.atlassian.com/git/tutorials/git-subtree)** or **`git filter-repo`** to extract history for `fleetly/` only (advanced).

See also [OSS-PUBLISHING.md](./OSS-PUBLISHING.md) for open-source scrub and boundaries.
