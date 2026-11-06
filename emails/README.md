# Email template

`emails/template.tsx` is how this site's marketing emails look. It is written
with [react-email](https://react.email) components and is separate from the
website: the website build and `tsc` ignore `emails/` (see `exclude` in
`tsconfig.json`), and `react-email` is not in this site's `package.json`. The
`compile_email_template` tool typechecks, bundles and renders it with its own
copy of react-email, then submits the result. A submitted template waits for
the site owner's approval in the Email view's Settings before any email uses it.

## The slot contract

The template does not contain any email's content. It renders placeholder
tokens ("slots"), and the email service fills them in when it sends. Every
token is plain text: never put one inside an HTML comment, an attribute other
than the ones below, `<head>`, `<title>` or `<style>`.

### `Layout` (the frame around every email)

| Token | Required | Filled with |
|---|---|---|
| `%%BLOCKS%%` | Yes, exactly once | The email's content: its heading, text, image and button blocks, in order |
| `%%FOOTER%%` | Yes, exactly once | The business name, postal address and unsubscribe link. The law requires them on every marketing email, so this slot must stay visible: never remove it, wrap it in a comment, or put it under an element styled `display:none`, `visibility:hidden`, `opacity:0`, `font-size:0` or `max-height:0` |
| `%%PREHEADER%%` | No | The preview line shown after the subject in the inbox |
| `%%LOGO_START%%` ... `%%LOGO_END%%` | No | A region around the logo. The whole region, markers included, is removed when the site has no logo |
| `%%LOGO_URL%%` | Inside the logo region | The site's logo image URL (use it as an `<Img src>`) |

### Block components

Each one renders a single block. Its tokens are filled with that block's
content, escaped.

| Component | Tokens |
|---|---|
| `Heading` | `%%TEXT%%` |
| `Text` | `%%TEXT%%` (may contain bold, italic and links) |
| `Image` | `%%SRC%%` (as the `<Img src>`) and `%%ALT%%` |
| `Button` | `%%TEXT%%` (the label) and `%%HREF%%` (as the link `href`) |

## Rules

- Keep every export: `Layout`, `Heading`, `Text`, `Image`, `Button`.
- Keep every token above in its component.
- No `<script>`. Images must use `https://` URLs. The compiled template must
  stay under 100KB.
- Use hex colours (`#1f2937`), inline `style` objects and email-safe font
  stacks (`Georgia, "Times New Roman", serif`). Email clients ignore
  stylesheets, CSS variables and most web fonts.
- Keep the content width at 600px or less.
- Import only from `react-email` and `react`. Site code and Tailwind classes
  are not available here.
