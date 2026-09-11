# The Reading Nook

Build a premium mobile-first e-book reader app designed to be a calm, distraction-free personal reading space.

The app is NOT a productivity dashboard, social network, bookstore, or AI tool collection. Reading must always be the primary experience.

CORE CONCEPT

The user maintains a personal library of books. They can add their own books as PDF files and cover images, read them in a reflowable book-style interface, and listen to them using natural-sounding AI/text-to-speech voices.

Books should sync between the phone and cloud so the user's library, reading progress, bookmarks, highlights, and notes can be restored on another device.

The interface should feel:

Calm

Premium

Literary

Minimal

Focused

Spacious

Modern but timeless

Avoid:

Neon colors

Excessive gradients

Gamification

Achievement badges

Cluttered dashboards

Excessive cards

Huge statistics

Unnecessary animations

Constant AI buttons

Tool-heavy interfaces

TECHNICAL FOUNDATION

Build this as a real functional application, not a visual mockup.

Use:

React

TypeScript

Tailwind CSS

Supabase for authentication, database, and cloud storage where appropriate

A structure suitable for packaging as a mobile app later

Design the architecture so books can be stored locally on the device for offline reading while their original files and important metadata are backed up to the cloud.

Do not use fake book data or fake statistics.

MAIN NAVIGATION

Keep navigation extremely simple:

Library

Search

Settings

The reader itself should become a distraction-free full-screen experience.

1. LIBRARY

The Library is the app's home.

Create a beautiful bookshelf-style interface.

At the top:

App name/logo

Search

Add Book button

Main content:

Continue Reading

Recently Added

Collections

All Books

Continue Reading should prioritize the book the user was most recently reading.

Each book should show:

Cover

Title

Author

Reading progress

Do not fill the screen with metadata.

The covers should visually dominate.

If there are no books yet, create an elegant empty state explaining that the user can add their first book.

2. ADD BOOK

Create a simple flow:

Add Book
→ Select PDF
→ Extract book content
→ Detect title/author where possible
→ Choose/upload cover
→ Review basic metadata
→ Add to Library

Keep metadata editing optional and minimal.

Allow:

Title

Author

Cover

Description

Collection/tags

The user should not need to manually enter unnecessary information.

3. BOOK DETAILS

When a book is selected, show:

Large cover

Title

Author

Description if available

Reading progress

Primary actions:

READ
LISTEN

Secondary actions:

Bookmark list

Highlights

Notes

Book settings

Keep this screen visually clean.

4. READING EXPERIENCE

This is the most important screen in the entire application.

Do NOT simply display the PDF page as a document viewer.

The app should extract the text from supported PDFs and render it as a reflowable, book-like reading experience optimized for mobile screens.

The reader should feel like reading a real digital book.

Requirements:

Comfortable typography

Excellent line spacing

Generous margins

Clear chapter headings

Smooth scrolling or page-based reading

Remember exact reading position

Automatically save progress

Chapter navigation

Table of contents when available

Search within the book

Bookmarks

Text selection

Highlights

Notes

Reader controls should remain hidden while reading.

A tap should reveal the controls.
Another tap should hide them.

Controls should be subtle and minimal.

Include:

Back

Table of contents

Bookmark

Search

Appearance

More

Do not keep a large toolbar permanently visible.

READING APPEARANCE

Provide a small set of carefully designed reading themes:

Light / paper

Warm / cream

Dark

Allow the user to adjust:

Font size

Line spacing

Margins

Font choice where technically appropriate

The settings interface must remain simple.

5. LISTENING

Allow the same book to be listened to using natural-sounding voices.

Create a dedicated listening interface that feels like an audiobook player rather than an AI chatbot.

Show:

Book cover

Book title

Chapter

Current position

Play/pause

Previous/next

Progress

Playback speed

Voice selection

Support natural voice options where the selected speech provider/API allows them.

Most importantly:

Reading and listening should share the same book/chapter context and remember the user's position.

For example:
If the user is reading Chapter 4 and chooses Listen, listening should begin around the relevant location rather than starting the entire book from the beginning.

Design the audio system so the speech provider can be changed later without rebuilding the entire app.

Do not hard-code a paid AI provider unless necessary. Keep the provider layer modular.

6. SEARCH

Create one clean search experience.

Search:

Book titles

Authors

Collections

When inside a book, search should search the book's extracted text.

Search results should be simple and readable.

7. BOOKMARKS, HIGHLIGHTS AND NOTES

Bookmarks:

Save a specific reading location

Show chapter/page/location

Tap to return

Highlights:

Select text

Highlight it

Store the selected text and its location

Notes:

Attach a note to a highlight or reading location

Edit/delete notes

These should be accessible without making them dominate the main interface.

8. COLLECTIONS

Allow books to be organized into simple collections such as:

Business
Psychology
Technology
Fiction
Education

But do not force users to categorize every book.

Collections should be optional.

9. CLOUD SYNC

Use Supabase to synchronize:

User account

Books and metadata

Reading progress

Bookmarks

Highlights

Notes

Collections

Preferences

Store original book files and covers in appropriate cloud storage.

The app should also maintain a local cache so previously downloaded books can be read offline.

If cloud sync fails, the user should not lose their local reading progress.

Handle sync conflicts safely.

10. SETTINGS

Keep Settings minimal.

Sections:

Reading

Font

Font size

Line spacing

Margins

Theme

Audio

Voice

Playback speed

Library

Storage

Cloud sync

Account

Sign in/out

Do not turn Settings into a giant configuration dashboard.

11. FOCUS READING MODE

Create an especially distraction-free reading state.

When the user enters Focus Reading Mode:

Hide navigation

Hide unnecessary controls

Remove visual distractions

Keep typography extremely comfortable

Allow controls to appear only when tapped

The feeling should be:

"Just me and the book."

DESIGN DIRECTION

Use a sophisticated neutral visual system.

Prefer:

Off-white

Warm cream

Charcoal

Soft gray

Very restrained accent color

Typography is extremely important.

Use an elegant serif or book-like typeface for reading content and a clean sans-serif for the application interface.

Large whitespace.

Subtle borders.

Very restrained shadows.

Smooth but short transitions.

Avoid the generic "AI SaaS" visual style.

Do not use excessive glassmorphism.

Do not use neon purple/blue gradients.

Do not make every element a rounded floating card.

The app should look like a premium digital reading environment.

RESPONSIVENESS

Design mobile-first.

The primary target is a phone.

The interface should also adapt gracefully to tablets and desktop browsers for development/testing.

Prioritize:

One-handed use where practical

Large enough touch targets

Comfortable reading dimensions

Fast transitions

Low visual complexity

PERFORMANCE

Optimize heavily for mobile.

Avoid unnecessary dependencies.

Lazy-load books and heavy resources.

Cache books locally when possible.

Do not load an entire library unnecessarily.

Reading should remain smooth even with a large personal library.

IMPORTANT IMPLEMENTATION RULES

Do not create fake functionality.

If a feature cannot yet be fully implemented because an external API/provider is required, create the correct architecture and clearly isolate the integration point rather than pretending it works.

Do not use fake book statistics, fake reviews, fake users, or fake social activity.

Do not add unnecessary features just to make the app look impressive.

The product's quality should come from its simplicity and reading experience.

Build the foundation first, then implement the Library, Add Book, Book Details, Reader, Listening, Search, and Settings experiences as real working flows.

The final result should feel like a private, premium bookshelf that disappears when the user starts reading.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/576bdce0-024a-4c1c-bb73-59212ae185c6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
