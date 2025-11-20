SecureDevCa — Secure Application Programming CA

This project is part of my 4th-year Secure Application Programming module.
The goal is to design, build, and document a small web application that demonstrates:

How common web vulnerabilities occur in real applications

How these vulnerabilities map to the OWASP Top 10

How insecure code can be refactored into secure implementations

How secure coding standards and SDLC practices are applied in practice

How to justify technical and ethical decisions made during development

The application remains intentionally small so the focus stays on security concepts—not full-stack production engineering.

-Learning Objectives-
1. Build intentionally vulnerable code (Insecure Branch)

The insecure branch contains deliberately flawed implementations that demonstrate:

- SQL Injection

- Reflected XSS

- Stored XSS

- DOM-based XSS

- Weak session management

- Hard-coded secrets and insecure configuration

2. Refactor vulnerabilities into secure code (Secure Branch)

The secure branch contains hardened versions of the insecure code using:

- Parameterised SQL queries / ORM

- Proper output encoding and input validation

- Secure session cookies

- Safe authentication and storage techniques

- Security headers and improved application configuration

Project Structure

The repository will contain three branches:

- main — final cleaned and documented version

- secure — secure implementation

- insecure — intentionally vulnerable implementation for testing and demonstration

-Application Flow-

User lands on the login page (insecure branch)

SQL injection can be tested directly in the login form.

After logging in, the user is taken to the insecure tasks page, which will demonstrate:

SQL injection through the search bar

Reflected XSS through unescaped query parameters

Stored XSS through task comments

DOM-based XSS via unsafe client-side rendering

The secure branch will later show the same pages, but fixed.
