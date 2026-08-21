# Kevin documentation

Help documentation for [Kevin](https://kevin.co) — photo-to-inventory for insurance
content adjusters and estate-sale professionals.

44 articles across 8 sections. `SUMMARY.md` is the GitBook table of
contents; each section is a folder and each article a Markdown file.

## Importing into GitBook

1. Push this folder to a Git repository, or zip it.
2. In GitBook, create a space and choose **Import** → from Git or from a file.
3. Point it at this folder. GitBook reads `SUMMARY.md` for structure.

## Source of truth

These files are **generated**. The originals live in the prototype as block data:

| File | Sections |
| --- | --- |
| `components/docs-articles.jsx` | Getting started, Worksheet |
| `components/docs-articles-2.jsx` | Exporting, Claims & policies, Estate sale mode, Account |
| `components/docs-articles-3.jsx` | In the field, Troubleshooting |

Edit whichever side becomes canonical for you — but pick one. Once GitBook is live it
should almost certainly be GitBook, and the in-app docs page should read from it.
