---
description: How to push your code to GitHub
---

# Push to GitHub Guide

Follow these steps to upload your project to GitHub:

1.  **Initialize Git (if not already done)**
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    ```

2.  **Create a Repository on GitHub**
    *   Go to [github.com/new](https://github.com/new).
    *   Enter a repository name (e.g., `ai-video-editor`).
    *   Click **Create repository**.

3.  **Connect and Push**
    *   Copy the commands under "…or push an existing repository from the command line". They will look like this (replace `YOUR_USERNAME` and `REPO_NAME`):
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
    git branch -M main
    git push -u origin main
    ```

4.  **Run the Commands**
    *   Paste and run those commands in your terminal here.

> [!TIP]
> If you don't have a GitHub account, you'll need to sign up first. If `git push` asks for a password, use a [Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) instead of your password.
