# Media, font, logo and product-design rights register

Status as of 2026-08-17: **all locally stored creative assets are UNVERIFIED unless evidence is added below.** Possession of a file is not proof of permission.

## Inventory scope

The repository contains creative assets under `assets/images/`, including `.png`, `.jpg`, `.jpeg`, `.webp`, `.avif` and `.mp4`, plus remote Google Fonts, Shopify product images/descriptions and partner/social-media logos or marks. The inventory must include every file returned by:

```sh
rg --files assets/images | sort
```

Hashes should be recorded so a licence can be tied to the exact file:

```sh
find assets/images -type f -print0 | sort -z | xargs -0 shasum -a 256
```

## Current asset groups

| Repository group | Likely content | Required proof | Status |
|---|---|---|---|
| `assets/images/effoMerch/` | Effo-X product artwork/photos | Designer/photographer assignment, model releases where applicable | UNVERIFIED |
| `assets/images/effo_shirts/` | Garment/product photography | Photographer licence/assignment and model releases | UNVERIFIED |
| `assets/images/shirts_fouad_companies/` | Client/partner apparel | Client trademark/logo authorization; photographer and model permissions | UNVERIFIED |
| `assets/images/partners/` | Third-party logos | Written trademark/logo-display approval | UNVERIFIED |
| `assets/images/brand effo/` | Brand/product samples | Creator assignment/licence and model releases | UNVERIFIED |
| `assets/images/blog2/`, `blog4/`, `2ndVisibleBlogmorePics/` | Event/blog photos and videos | Photographer/videographer licence plus identifiable-person release | UNVERIFIED |
| `assets/images/categories/` | Collection/marketing imagery | Source invoice/licence or original-creator assignment | UNVERIFIED |
| Generic “stock”/numbered files and background/video assets | Possible stock media | Stock-provider invoice and licence terms covering commercial web/social use | UNVERIFIED |
| Effo-X logos and wordmarks | Brand identity | Designer assignment; trademark clearance/registration file | UNVERIFIED |
| Shopify-hosted product media | Product catalogue | Supplier/creator licence, product-design and model rights | UNVERIFIED |
| Google Font: Josefin Sans | Remote webfont | Preserve SIL Open Font License notice; preferably self-host licensed files | LICENCE SOURCE KNOWN; COPY NOT FILED |
| Social platform icons | Platform marks | Compliance with current platform brand guidelines | UNVERIFIED |

## Evidence naming

Place evidence in `legal/evidence/` using:

`YYYY-MM-DD__asset-or-group__party__evidence-type.pdf`

Examples: `2026-08-17__partners-logo1__partner-name__logo-permission.pdf`, `2026-08-17__sportstock-video__provider__licence-invoice.pdf`.

For each evidence file, add a row:

| Asset path/hash | Owner/licensor | Rights granted | Territory/term | Model/property release | Evidence filename | Reviewed by/date |
|---|---|---|---|---|---|---|
| _No evidence filed_ | | | | | | |

## Release minimums

- Commercial website, advertising, social, email and marketplace use.
- Right to crop, resize, subtitle, translate and combine where needed; moral-rights consent where appropriate.
- Worldwide territory and sufficient term.
- Names/logos/trademarks and endorsement wording explicitly covered.
- Identifiable adults sign model releases; guardians sign for minors.
- Custom-apparel customers warrant ownership/permission and indemnify Effo-X for supplied artwork, subject to counsel review.
