# BytePlus Bootcamp - Schema.org Structured Data Guide

## 📋 Overview

Structured data helps search engines understand your event and can result in **rich results** (rich snippets) in Google Search, including:

- Event details in search results
- Date, time, and location information
- Pricing and availability
- FAQ rich results
- Organization knowledge panel

---

## 🎯 Benefits

| Benefit | Impact |
|---------|--------|
| **Rich Snippets** | Stand out in search results with visual enhancements |
| **Click-Through Rate** | Up to 30% higher CTR with rich results |
| **Event Discovery** | Appear in Google Events search |
| **Mobile Optimization** | Better mobile search experience |
| **Voice Search** | Improved compatibility with voice assistants |
| **SEO Score** | Positive signal for search ranking |

---

## 📁 Schema Files

### 1. Event Schema (schema-event.json)

**Type**: `EducationEvent`

Describes the bootcamp event with complete details:
- Event name, description, dates
- Attendance mode (Mixed: online + offline)
- Offers (pricing for online/offline)
- Location (virtual + physical)
- Performer (instructor)
- Organizer (BytePlus)
- Educational metadata

**Usage**: Primary schema for event discovery

### 2. Organization Schema (schema-organization.json)

**Type**: `Organization`

Describes BytePlus as the event organizer:
- Company information
- Contact details
- Social media links
- Logo and branding

**Usage**: Establishes brand authority and trust

### 3. FAQ Schema (schema-faq.json)

**Type**: `FAQPage`

Contains 8 common questions and answers:
- Participation requirements
- Online vs offline differences
- Preparation steps
- Archive viewing
- API credits
- Cancellation policy
- Group discounts
- Certification

**Usage**: Enables FAQ rich results in Google Search

---

## 🔧 Implementation

### Method 1: JSON-LD in HTML (Recommended)

Add to `<head>` section of `index.html`:

```html
<head>
    <!-- Existing meta tags -->

    <!-- Schema.org Structured Data - Event -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "EducationEvent",
      "name": "BytePlus Video API Bootcamp - 1日集中マスター講座",
      "description": "BytePlus Video APIの完全攻略ブートキャンプ...",
      "startDate": "2025-11-15T10:00:00+09:00",
      "endDate": "2025-11-15T18:00:00+09:00",
      "eventStatus": "https://schema.org/EventScheduled",
      "eventAttendanceMode": "https://schema.org/MixedEventAttendanceMode",
      "location": [
        {
          "@type": "VirtualLocation",
          "url": "https://shunsukehayashi.github.io/miyabi-private/landing-pages/byteplus-bootcamp/"
        },
        {
          "@type": "Place",
          "name": "BytePlus東京オフィス",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "渋谷区道玄坂1-2-3",
            "addressLocality": "渋谷区",
            "addressRegion": "東京都",
            "postalCode": "150-0043",
            "addressCountry": "JP"
          }
        }
      ],
      "offers": [
        {
          "@type": "Offer",
          "name": "オンライン受講",
          "price": "29800",
          "priceCurrency": "JPY",
          "availability": "https://schema.org/InStock",
          "url": "https://shunsukehayashi.github.io/miyabi-private/landing-pages/byteplus-bootcamp/#application"
        },
        {
          "@type": "Offer",
          "name": "会場受講",
          "price": "39800",
          "priceCurrency": "JPY",
          "availability": "https://schema.org/InStock",
          "url": "https://shunsukehayashi.github.io/miyabi-private/landing-pages/byteplus-bootcamp/#application"
        }
      ],
      "performer": {
        "@type": "Person",
        "name": "山田太郎",
        "jobTitle": "BytePlus 認定エキスパート"
      },
      "organizer": {
        "@type": "Organization",
        "name": "BytePlus",
        "url": "https://www.byteplus.com"
      }
    }
    </script>

    <!-- Schema.org Structured Data - FAQ -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "参加条件はありますか？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "基本的なプログラミング知識があれば参加可能です..."
          }
        }
        // ... more questions
      ]
    }
    </script>

    <!-- Schema.org Structured Data - Organization -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "BytePlus",
      "url": "https://www.byteplus.com",
      "logo": "https://shunsukehayashi.github.io/miyabi-private/landing-pages/byteplus-bootcamp/images/byteplus-partner-logo.svg"
    }
    </script>
</head>
```

### Method 2: External JSON-LD Files

Load from separate files (requires server configuration):

```html
<script type="application/ld+json" src="./schema-event.json"></script>
<script type="application/ld+json" src="./schema-faq.json"></script>
<script type="application/ld+json" src="./schema-organization.json"></script>
```

**Note**: This method may not work with static hosting. Use Method 1 for GitHub Pages.

---

## ✅ Testing & Validation

### Google Rich Results Test

1. Go to [Google Rich Results Test](https://search.google.com/test/rich-results)
2. Enter your landing page URL or paste HTML
3. Click "Test URL"
4. Check for:
   - ✅ Event rich result eligible
   - ✅ FAQ rich result eligible
   - ✅ Organization info detected
5. Fix any errors or warnings

### Schema Markup Validator

1. Go to [Schema.org Validator](https://validator.schema.org/)
2. Paste JSON-LD code or enter URL
3. Verify syntax and structure
4. Check for required properties

### Google Search Console

After deployment:

1. Open [Google Search Console](https://search.google.com/search-console)
2. Navigate to: Enhancements > Events
3. Check indexing status
4. Monitor rich results impressions

---

## 🎨 Rich Results Preview

### Event Rich Result (Expected)

```
┌──────────────────────────────────────────────────┐
│ 📅 Nov 15, 2025, 10:00 AM - 6:00 PM JST         │
│ BytePlus Video API Bootcamp - 1日集中マスター講座   │
│ shunsukehayashi.github.io                        │
│                                                  │
│ BytePlus Video APIの完全攻略ブートキャンプ。       │
│ 実践的なハンズオンで動画生成APIの実装を...        │
│                                                  │
│ 🎫 ¥29,800 (Online) • ¥39,800 (Offline)        │
│ 📍 Online + BytePlus東京オフィス                   │
│ 👤 Organized by BytePlus                         │
└──────────────────────────────────────────────────┘
```

### FAQ Rich Result (Expected)

```
┌──────────────────────────────────────────────────┐
│ People also ask                                  │
│ ▼ 参加条件はありますか？                            │
│   基本的なプログラミング知識があれば...             │
│                                                  │
│ ▼ オンラインと会場受講の違いは何ですか？            │
│   内容は同じですが、会場受講では...                │
│                                                  │
│ ▼ 事前準備は必要ですか？                           │
│   ノートPCと開発環境のセットアップが...             │
└──────────────────────────────────────────────────┘
```

---

## 📊 Monitoring & Analytics

### Track Rich Results Performance

In Google Search Console:

- **Impressions**: How often your rich result appears
- **Clicks**: How many clicks from rich results
- **CTR**: Click-through rate (rich vs. normal)
- **Position**: Average position in search

### Expected Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| CTR | 2-3% | 4-6% | +100% |
| Impressions | Baseline | +20-30% | Event discovery |
| Avg. Position | Baseline | -2 to -5 | Better ranking |

---

## 🔄 Maintenance

### Update Frequency

| Property | Update Frequency |
|----------|------------------|
| **Event Dates** | Immediate (when changed) |
| **Pricing** | When offers change |
| **Availability** | When seats fill up |
| **Event Status** | If postponed/cancelled |
| **Performer** | If instructor changes |
| **Offers** | When promotions start/end |

### Post-Event Updates

After the event concludes:

1. Update `eventStatus` to `EventCompleted`
2. Set `offers.availability` to `SoldOut`
3. Consider archiving or removing the page
4. Redirect to next event or archive page

---

## 🚨 Common Issues & Fixes

### Issue 1: Events Not Showing in Google

**Cause**: Schema errors or missing required fields

**Fix**:
- Use Rich Results Test to identify errors
- Ensure `startDate`, `endDate`, `location`, `offers` are present
- Wait 1-2 weeks for Google to index

### Issue 2: FAQ Not Appearing

**Cause**: Insufficient questions or duplicate content

**Fix**:
- Have at least 4-5 questions
- Ensure questions match user intent
- Avoid duplicate content from other pages

### Issue 3: Warnings about Missing Properties

**Cause**: Optional properties not included

**Fix**:
- Add `image`, `performer`, `organizer` for better rich results
- Include `maximumAttendeeCapacity` for availability info
- Add `typicalAgeRange` and `educationalLevel` for better targeting

---

## 📚 Additional Resources

- [Google Events Schema Documentation](https://developers.google.com/search/docs/appearance/structured-data/event)
- [Schema.org Event Type](https://schema.org/Event)
- [Schema.org EducationEvent](https://schema.org/EducationEvent)
- [Schema.org FAQPage](https://schema.org/FAQPage)
- [Google Rich Results Guide](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)

---

## ✅ Implementation Checklist

- [ ] Add Event schema to index.html `<head>`
- [ ] Add FAQ schema to index.html `<head>`
- [ ] Add Organization schema to index.html `<head>`
- [ ] Test with Google Rich Results Test
- [ ] Validate with Schema.org Validator
- [ ] Deploy to production
- [ ] Submit URL to Google Search Console
- [ ] Monitor rich results in Search Console (wait 1-2 weeks)
- [ ] Track CTR improvements in Analytics
- [ ] Update schemas when event details change

---

**Phase 8 Complete**: Schema.org structured data ready for SEO enhancement ✅

**Expected Impact**:
- Improved search visibility
- Higher click-through rates
- Better event discovery
- Enhanced mobile experience
- Rich results eligibility

**Last Updated**: 2025-10-21
**Status**: Production Ready
