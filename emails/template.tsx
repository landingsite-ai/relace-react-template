/**
 * This site's email template: how every marketing email from this site looks.
 *
 * It is compiled by the `compile_email_template` tool, not by the website
 * build (`tsconfig.json` excludes `emails/`, and `react-email` comes from the
 * compile tool, not this site's package.json). Read `emails/README.md` before
 * editing. In short:
 *
 * - `Layout` is the frame around every email. It must contain `%%BLOCKS%%`
 *   and `%%FOOTER%%` exactly once each, as visible text. `%%FOOTER%%` becomes
 *   the business name, postal address and unsubscribe link, which the email
 *   service adds: never remove, hide or shrink it.
 * - `Heading`, `Text`, `Image` and `Button` are the building blocks an email's
 *   content is made of. Each must keep its slot tokens (`%%TEXT%%`, `%%SRC%%`,
 *   `%%ALT%%`, `%%HREF%%`).
 * - Change colours, fonts, spacing and borders freely. Use hex colours and
 *   email-safe font stacks; email clients ignore stylesheets and web fonts.
 */
import {
  Body,
  Button as EmailButton,
  Container,
  Head,
  Heading as EmailHeading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text as EmailText,
} from "react-email";

const fontFamily =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const colors = {
  background: "#f6f9fc",
  surface: "#ffffff",
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  button: "#111827",
  buttonText: "#ffffff",
};

/** The frame around every email. */
export function Layout() {
  return (
    <Html lang="en">
      <Head />
      <Preview>%%PREHEADER%%</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* The site's logo. The whole region is removed when the site has no logo. */}
          %%LOGO_START%%
          <Section style={logoSection}>
            <Img src="%%LOGO_URL%%" alt="Logo" height="48" style={logo} />
          </Section>
          %%LOGO_END%%
          %%BLOCKS%%
          <Hr style={hr} />
          {/* Business name, postal address and unsubscribe link. Required. */}
          <Section style={footer}>%%FOOTER%%</Section>
        </Container>
      </Body>
    </Html>
  );
}

/** A heading block. */
export function Heading() {
  return (
    <EmailHeading as="h1" style={heading}>
      %%TEXT%%
    </EmailHeading>
  );
}

/** A paragraph block. */
export function Text() {
  return <EmailText style={paragraph}>%%TEXT%%</EmailText>;
}

/** An image block. */
export function Image() {
  return (
    <Section style={imageSection}>
      <Img src="%%SRC%%" alt="%%ALT%%" width="536" style={image} />
    </Section>
  );
}

/** A button (call to action) block. */
export function Button() {
  return (
    <Section style={buttonSection}>
      <EmailButton href="%%HREF%%" style={button}>
        %%TEXT%%
      </EmailButton>
    </Section>
  );
}

const body = {
  backgroundColor: colors.background,
  fontFamily,
  margin: "0",
  padding: "24px 0",
};

const container = {
  backgroundColor: colors.surface,
  margin: "0 auto",
  padding: "32px",
  maxWidth: "600px",
  width: "100%",
};

const logoSection = { padding: "0 0 24px" };
const logo = { display: "block", height: "48px", width: "auto" };

const heading = {
  color: colors.text,
  fontFamily,
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "32px",
  margin: "0 0 16px",
};

const paragraph = {
  color: colors.text,
  fontFamily,
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 16px",
};

const imageSection = { padding: "0 0 16px" };
const image = {
  display: "block",
  width: "100%",
  maxWidth: "536px",
  height: "auto",
  borderRadius: "4px",
};

const buttonSection = { padding: "8px 0 24px" };
const button = {
  backgroundColor: colors.button,
  borderRadius: "6px",
  color: colors.buttonText,
  fontFamily,
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  display: "inline-block",
  padding: "12px 24px",
};

const hr = { borderColor: colors.border, margin: "24px 0 16px" };
const footer = {
  color: colors.muted,
  fontFamily,
  fontSize: "12px",
  lineHeight: "18px",
};
