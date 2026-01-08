# Miyabi AI Agent Framework - Visual Assets Implementation Guide

## Quick Start

This guide provides step-by-step instructions for creating the professional visual assets for your Miyabi AI Agent Framework GitHub Marketplace submission.

---

## Phase 1: App Icon Creation

### Option A: Using Figma (Recommended)

1. **Open the SVG mockup**:
   - Open `/docs/design/app-icon-mockup.svg` in Figma
   - Import the SVG as a new frame

2. **Create multiple sizes**:
   ```
   200x200px (Primary)
   128x128px (Large)
   64x64px (Medium)
   32x32px (Small)
   16x16px (Tiny)
   ```

3. **Export settings**:
   - Format: PNG
   - Background: Transparent
   - Scale: 2x for retina displays

### Option B: Using Canva

1. **Create new design**:
   - Select "Logo" template (500x500px)
   - Use dark/transparent background

2. **Design elements**:
   - **Base**: Hexagonal outline in `#3b82f6`
   - **M-shape**: Connected nodes forming letter M
   - **Colors**: Primary `#3b82f6`, Secondary `#8b5cf6`, Accent `#10b981`

3. **Export steps**:
   - Download as PNG with transparent background
   - Resize to required dimensions using design tool

### Quality Checklist
- ✅ Crisp edges at all sizes (especially 16px)
- ✅ Readable on both light and dark backgrounds
- ✅ Consistent with Miyabi brand colors
- ✅ Professional, modern appearance

---

## Phase 2: Banner Image Creation

### Using the HTML Mockup

1. **Open banner-mockup.html**:
   - Open `/docs/design/banner-mockup.html` in browser
   - Use browser developer tools to capture at exact 1280x640px

2. **Screenshot capture**:
   ```bash
   # Method 1: Browser Developer Tools
   - Press F12 → Device Toolbar
   - Set dimensions to 1280x640
   - Take screenshot

   # Method 2: Browser Extension
   - Use "Full Page Screen Capture" extension
   - Crop to exact dimensions
   ```

3. **Alternative: Recreate in Figma**:
   - Create frame 1280x640px
   - Use the HTML mockup as reference
   - Implement the same layout and styling

### Content Requirements
- **Main Headline**: "Build Reality-Based AI Agents"
- **Subheadline**: "The world's first framework designed for practical, production-ready autonomous agents"
- **Benefits**:
  - ⚡ From prompt to deployment in minutes, not months
  - 🔒 Enterprise-ready security and monitoring
  - 🔧 Seamless GitHub workflow integration
- **CTA**: "Start Building →"

---

## Phase 3: Screenshot Series Creation

### Method 1: Build Functional UI (Recommended)

If you have a working Miyabi dashboard:

1. **Set up staging environment**:
   ```bash
   cd miyabi-private
   npm run dev
   # Navigate to localhost:3000
   ```

2. **Capture screenshots**:
   - Use browser at exactly 1200x900px
   - Populate with realistic demo data
   - Follow wireframe layouts in `/docs/design/screenshot-wireframes.html`

### Method 2: Create Mockups

Using the wireframes provided:

1. **Open wireframes**:
   - Open `/docs/design/screenshot-wireframes.html`
   - Each wireframe shows exact layout and content

2. **Screenshot each section**:
   - Crop each wireframe to 1200x900px
   - Ensure text is readable at actual size

3. **Enhance if needed**:
   - Add realistic data instead of placeholder text
   - Improve visual polish (shadows, animations)

### Screenshot Requirements

#### Screenshot 1: Agent Creation Wizard
- **Focus**: User-friendly onboarding process
- **Key elements**: Template selection, progress indicator, configuration form
- **Message**: "Creating agents is simple and guided"

#### Screenshot 2: Dashboard Overview
- **Focus**: Professional monitoring interface
- **Key elements**: Agent grid, status indicators, performance metrics
- **Message**: "Monitor all your agents at a glance"

#### Screenshot 3: GitHub Integration
- **Focus**: Seamless workflow integration
- **Key elements**: Repository connection, automated actions, workflow status
- **Message**: "Native GitHub workflow integration"

#### Screenshot 4: Analytics Dashboard
- **Focus**: Production-ready insights
- **Key elements**: Performance charts, resource usage, cost analysis
- **Message**: "Enterprise-grade analytics and monitoring"

#### Screenshot 5: Prompt Optimization
- **Focus**: Advanced agent development tools
- **Key elements**: Code editor, test scenarios, performance metrics
- **Message**: "Optimize agent performance with precision"

---

## Phase 4: Quality Assurance

### Technical Validation

1. **File sizes**:
   ```bash
   # Check file sizes (should be <500KB each)
   ls -la assets/*.png

   # Optimize if needed
   # Use tools like TinyPNG or ImageOptim
   ```

2. **Dimensions verification**:
   ```bash
   # Verify exact dimensions
   file assets/*.png
   # Should show exact required dimensions
   ```

3. **Color accuracy**:
   - Use color picker to verify brand colors
   - Ensure consistency across all assets

### Visual Review Checklist

- ✅ **Brand Consistency**: All assets use Miyabi color palette
- ✅ **Professional Quality**: Enterprise-grade visual appearance
- ✅ **Readability**: All text readable at required sizes
- ✅ **Realistic Content**: Authentic product interface, not generic mockups
- ✅ **Value Proposition**: Clear benefits communicated visually

### GitHub Marketplace Compliance

1. **App Icon Requirements**:
   - ✅ 200x200px PNG with transparent background
   - ✅ No text overlay (symbol only)
   - ✅ Scalable to 16x16px minimum

2. **Banner Requirements**:
   - ✅ Exactly 1280x640px
   - ✅ Clear value proposition
   - ✅ Professional appearance

3. **Screenshot Requirements**:
   - ✅ Exactly 1200x900px each
   - ✅ Maximum 6 screenshots
   - ✅ Authentic product interface

---

## Phase 5: File Organization

### Directory Structure
```
assets/
├── icons/
│   ├── app-icon-200x200.png
│   ├── app-icon-128x128.png
│   ├── app-icon-64x64.png
│   ├── app-icon-32x32.png
│   └── app-icon-16x16.png
├── banners/
│   ├── marketplace-banner-1280x640.png
│   └── marketplace-banner-1280x640@2x.png
├── screenshots/
│   ├── 01-agent-creation-wizard-1200x900.png
│   ├── 02-dashboard-overview-1200x900.png
│   ├── 03-github-integration-1200x900.png
│   ├── 04-analytics-dashboard-1200x900.png
│   └── 05-prompt-optimization-1200x900.png
└── source/
    ├── app-icon-mockup.svg
    ├── banner-mockup.html
    └── screenshot-wireframes.html
```

### File Naming Convention
- Use descriptive, kebab-case names
- Include dimensions in filename
- Version with @2x for retina displays where applicable

---

## Tools & Resources

### Design Tools
- **Figma**: Professional design tool (recommended)
- **Canva**: User-friendly alternative
- **Sketch**: Mac-only professional tool
- **GIMP**: Free alternative

### Screenshot Tools
- **Browser DevTools**: Built-in browser tools
- **CleanShot X** (Mac): Professional screenshot tool
- **Greenshot** (Windows): Free screenshot tool
- **LightShot**: Cross-platform option

### Optimization Tools
- **TinyPNG**: PNG compression
- **ImageOptim** (Mac): Image optimization
- **Squoosh**: Web-based image optimization

### Color Tools
- **Coolors**: Color palette generator
- **Contrast Checker**: WCAG compliance
- **ColorZilla**: Browser color picker

---

## Competitive Analysis Reference

### Positioning Strategy

| Aspect | Miyabi Advantage | Visual Emphasis |
|--------|------------------|-----------------|
| **Professional** | Dark theme, enterprise UI | Clean, developer-focused aesthetic |
| **Production-Ready** | Real metrics, monitoring | Actual performance data in screenshots |
| **Integration** | Native GitHub workflow | Seamless workflow visuals |
| **Ease of Use** | Guided wizard, templates | Step-by-step onboarding flows |

### Visual Differentiation
1. **Dark Theme**: Professional developer aesthetic
2. **Real Data**: Authentic metrics vs. placeholder content
3. **Enterprise Features**: Security, monitoring, compliance indicators
4. **Modern Design**: Contemporary UI patterns and micro-interactions

---

## Success Metrics & Goals

### Conversion Targets
- **GitHub Stars**: 1,000+ within 30 days
- **Install Rate**: 15%+ from marketplace views
- **User Retention**: 80%+ onboarding completion
- **Enterprise Adoption**: 10+ enterprise customers in 60 days

### Visual Quality Indicators
- **Professional Perception**: "Enterprise-grade" user feedback
- **Brand Recognition**: Consistent visual identity
- **User Experience**: Clear value proposition communication
- **Technical Quality**: Fast loading, crisp rendering

---

## Troubleshooting

### Common Issues

#### Blurry Icons at Small Sizes
```bash
# Solution: Recreate with vector graphics
# Use SVG source, export at exact dimensions
# Avoid scaling down from larger images
```

#### Color Inconsistency
```bash
# Solution: Use color variables
# Define exact hex values: #3b82f6, #8b5cf6, #10b981
# Use consistent color picker tool
```

#### File Size Too Large
```bash
# Solution: Optimize images
# Use PNG for icons/screenshots
# Compress with tools like TinyPNG
# Target <500KB per file
```

#### Screenshot Text Unreadable
```bash
# Solution: Increase font sizes
# Use minimum 14px for body text
# Ensure high contrast ratios
# Test at actual viewing sizes
```

### Getting Help

1. **Design Review**: Share assets in team chat for feedback
2. **Technical Issues**: Check GitHub Marketplace documentation
3. **Quality Assurance**: Use automated tools for validation

---

## Final Submission Checklist

Before submitting to GitHub Marketplace:

### Technical Requirements
- ✅ All files in correct dimensions
- ✅ Transparent backgrounds where required
- ✅ Optimized file sizes (<500KB each)
- ✅ Proper file naming convention

### Content Requirements
- ✅ Clear value proposition in banner
- ✅ Realistic product interface in screenshots
- ✅ Professional visual quality throughout
- ✅ Consistent brand identity

### Competitive Positioning
- ✅ Emphasizes enterprise readiness
- ✅ Shows real monitoring/analytics
- ✅ Demonstrates GitHub integration
- ✅ Highlights ease of use

### Brand Compliance
- ✅ Miyabi color palette used consistently
- ✅ Professional developer aesthetic
- ✅ Modern UI design patterns
- ✅ Authentic product representation

---

*With these assets, Miyabi AI Agent Framework will present as the premium choice for professional developers and enterprise teams seeking reliable, production-ready AI automation.*