# Security

## Reporting a vulnerability

Please report security problems privately rather than in a public issue: use
GitHub's **Report a vulnerability** button on the repository's Security tab.
Include what you found, how to reproduce it, and what you think the impact is.
You'll get a reply within a few days.

## What's worth knowing

- There are no accounts. A browser-generated guest id scopes each visitor's
  resumes; it is **not** authentication, and anyone who learns an id can read
  that guest's resumes. This is documented under Limitations in the README.
- The PDF route renders caller-supplied HTML in headless Chromium. JavaScript
  is disabled and every network request is aborted. A way around that is the
  kind of report we most want to hear about.
