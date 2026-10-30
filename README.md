# reego.ai

The company website for **Reego**, an AI engineering studio. It's a [Jekyll](https://jekyllrb.com) static site. Nearly all content lives in YAML files, so most updates don't touch any HTML.

## Editing content

| What | File |
|---|---|
| Company info, hero, stats, tech strip, about, contact, socials, nav | `_data/company.yml` |
| Services ("What we build") | `_data/services.yml` |
| Consulting topics & engagement formats | `_data/consulting.yml` |
| Products, open-source packages, client work | `_data/projects.yml` |
| Project type labels/colours | `_data/kinds.yml` |
| "How we work" steps | `_data/process.yml` |
| Testimonials & client names | `_data/testimonials.yml` |
| FAQ | `_data/faq.yml` |
| Blog authors | `_data/authors.yml` |
| Section order on the home page | `index.html` |

### Add a project

Copy any block in `_data/projects.yml`, change the fields, and commit. Set `featured: true` to show it on the home page as well. The full list is always on `/work/`. The field reference is at the top of the file.

```yaml
- name: my-new-package
  kind: open-source        # product | open-source | client | tool
  registry: pypi           # optional: pypi | npm
  install: pip install my-new-package
  tagline: One-line pitch
  description: Two or three sentences.
  tags: [LLM, CLI]
  featured: true
  links:
    - { label: PyPI,   url: "https://pypi.org/project/my-new-package/" }
    - { label: GitHub, url: "https://github.com/reegosoftware/my-new-package" }
```

### Write a blog post

Create `_posts/YYYY-MM-DD-your-slug.md`:

```markdown
---
title: "Your post title"
description: One or two sentences shown in cards and search results.
tags: [Agents, Context engineering]
author: hasan              # key from _data/authors.yml
---

Markdown content. Code blocks get syntax highlighting.
```

To list a post that's published somewhere else (for example on hasanyilmaz.me), add `external_url`, `canonical_url` and `source` to the front matter and leave the body empty. The card links straight to the original page.

### Contact form

The default form opens the visitor's email app with the message filled in, so it needs no backend. For a real form inbox, create a free [Formspree](https://formspree.io) form (or similar) and set `contact.form_endpoint` in `_data/company.yml`. Set `contact.calendar` to a Cal.com or Calendly link to show a "Book a call" option.

## Run locally

Requires Ruby ≥ 3.1. macOS ships Ruby 2.6, so install a newer one with `brew install ruby`.

```bash
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"   # macOS + Homebrew Ruby
bundle install
bundle exec jekyll serve --livereload            # → http://localhost:4000
```

## Deploy

### GitHub Pages (default)

1. Push this folder to a repo in the `reegosoftware` org, for example `reegosoftware/reego.ai`, on the `main` branch.
2. In the repo, go to **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions**.
3. `.github/workflows/pages.yml` builds and deploys on every push to `main`.
4. Custom domain: under **Settings → Pages → Custom domain**, the domain is set to `www.reego.ai` with **Enforce HTTPS** on. DNS is managed in Squarespace:
   - `A` records for `www` pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153`. These are A records rather than a CNAME because `www` also holds the `anthropic-domain-verification` TXT record, and a CNAME can't share a host with other records.
   - Optional: the same four `A` records on `@`, so `reego.ai` redirects to `www.reego.ai`. Keep the existing Google TXT and MX records.

### Vercel (later)

`vercel.json` is already set up. Import the repo in Vercel (it detects Jekyll), or run `vercel --prod`. Then add `reego.ai` under **Project → Domains** and move DNS from GitHub Pages to Vercel.

## Structure

```
_data/            ← all editable content (YAML)
_posts/           ← blog posts (Markdown)
_includes/
  sections/       ← home page sections (hero, services, work, …)
  icon.html       ← inline SVG icon set (use names in YAML `icon:` fields)
_layouts/         ← default, page, post
_sass/            ← styles (tokens = colours/fonts, light & dark)
assets/           ← css entry, js, images
work/, blog/      ← listing pages with filters
```
