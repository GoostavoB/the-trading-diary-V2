# The Trading Diary - Product Backlog

**Last Updated:** October 23, 2025  
**Total Items:** 42  
**Status:** Active Development

---

## 📊 Priority Legend

| Priority | Label | Description |
|----------|-------|-------------|
| 🔴 | **Critical** | Showstoppers or core functionality blockers |
| 🟠 | **High** | Essential features for launch/core experience |
| 🟡 | **Medium** | Important UX improvements and enhancements |
| 🟢 | **Low** | Nice-to-have features for future phases |

## 📈 Status Definitions

- **Planned** - Backlog item, not started
- **In Progress** - Actively being developed
- **Blocked** - Waiting on dependencies or decisions
- **Completed** - Implemented and verified
- **Cancelled** - Removed from roadmap

---

## 🔴 CRITICAL PRIORITY (7 items)

### #9 - Trading Assistant com LLM contextual (Pro/Elite)
**Status:** ✅ Completed (Backend deployed)  
**Priority:** Critical  
**Complexity:** XL

**Problem:**  
Current assistant provides poor responses. Need real LLM integration with trading mentor persona and user context.

**Objective:**  
Transform assistant into a useful tool for trading concepts and personal analysis.

**Technical Actions:**
- ✅ Integrate LLM API (Lovable AI)
- ✅ Develop specialized trading mentor prompt system
- ✅ Inject user metrics and trading data as context
- ✅ Support both general questions and personal queries
- ✅ Implement streaming responses for better UX
- ✅ Add conversation history and context management
- ✅ Edge function deployed: ai-dashboard-assistant

**Acceptance Criteria:**
- ✅ Answers general trading questions accurately
- ✅ Provides personal insights based on user data
- ✅ Fast response times with streaming
- ✅ Relevant and actionable advice
- ✅ Uses user's actual trade data in responses
- Available only to Pro/Elite tiers (requires tier check in UI)

**Completed:** October 24, 2025

**Dependencies:** Lovable AI API (configured and working)

---

### #15 - Timeframe: selecionar 1 dia e filtrar todos os dados
**Status:** ✅ Completed  
**Priority:** Critical  
**Complexity:** L

**Problem:**  
Cannot select a single day. Need to distinguish "today" visually and apply filter across Dashboard, Insights, and Trading History.

**Objective:**  
Complete coherence between date selection and displayed data.

**Technical Actions:**
- ✅ Allow range selection of 1 day
- ✅ Add special "today" indicator (border/badge)
- ✅ Propagate filter to backend queries
- ✅ Update all charts/lists/metrics in real-time
- ✅ Sync timeframe state across all sections
- ✅ Add validation to prevent invalid date ranges

**Acceptance Criteria:**
- ✅ Can select single day in timeframe picker
- ✅ "Today" has clear visual distinction
- ✅ All data reflects selected period exactly
- ✅ Filter persists during session
- ✅ Clear UI feedback when data is loading

**Completed:** October 24, 2025

---

### #17 - Fix API import de trades (BingX, Bybit, etc.)
**Status:** Planned  
**Priority:** Critical  
**Complexity:** XL

**Problem:**  
Exchange connections work but don't load trades. Modal shows "[Exchange]" placeholder instead of exchange name.

**Objective:**  
Restore real trade import and proper exchange identification.

**Technical Actions:**
- Add comprehensive logging for API calls
- Fix `exchange.name` display issue
- Verify API endpoints and signatures for each exchange
- Handle empty responses and error states
- Implement pagination for large trade lists
- Add retry logic with exponential backoff
- Test with real BingX and Bybit accounts

**Acceptance Criteria:**
- ✅ Trades list loads successfully from connected exchanges
- ✅ Modal displays "from BingX" / "from Bybit" correctly
- ✅ Clear error messages for common failures
- ✅ Handles rate limits gracefully
- ✅ Supports pagination for users with many trades

**Dependencies:** Exchange API credentials, Phase 10 adapter fixes

---

### #19 - Upload UX premium + 3 slots + confirmação de créditos
**Status:** ✅ Completed (Backend + UI)  
**Priority:** Critical  
**Complexity:** XL

**Problem:**  
Upload experience needs overhaul: not responsive, no multi-image support, credit deduction is unclear.

**Objective:**  
Transform core upload feature into fluid and reliable experience.

**Technical Actions:**
- ✅ Build responsive container with modern layout
- ✅ Create 3-slot grid for multiple image upload (MultiImageUpload component)
- ✅ Implement OCR processing for all images
- ✅ Add trade detection counter (show detected trades before processing)
- ✅ Create confirmation modal showing credits and trade counts
- ✅ Edge function deployed: process-multi-upload
- ✅ Integrated into Upload page as "Batch Upload" tab
- ✅ Drag-and-drop support
- ✅ Show processing progress indicators
- ✅ Handle errors gracefully with retry options

**Acceptance Criteria:**
- ✅ Upload works on all screen sizes
- ✅ Can upload up to 3 images per trade
- ✅ Detects trades accurately and shows count
- ✅ Confirmation modal appears before credit deduction
- ✅ Credits deducted via edge function
- ✅ Fast processing with clear feedback
- ✅ Robust error handling

**Completed:** October 24, 2025

**Notes:** Core differentiator implemented with premium batch processing.

---

### #31 - Goals: criação, widget no Dashboard e projeção
**Status:** ✅ Completed  
**Priority:** Critical  
**Complexity:** L

**Problem:**  
"Failed to Save Goal" error. No dashboard widget to track progress.

**Objective:**  
Transform goals into real, motivating tracking system.

**Technical Actions:**
- ✅ Fix goal creation API endpoint (added description column)
- ✅ Database schema updated
- ✅ Applied design system tokens for consistency
- Create premium visual widget template
- Implement projection calculation algorithm:
  - Current progress vs. time elapsed
  - Days remaining until deadline
  - Probability of achieving goal (based on current trajectory)
  - Required daily/weekly performance to meet goal
- Add daily automatic update
- Implement delay alerts ("You're falling behind schedule")
- Allow widget customization (size, metrics shown)

**Acceptance Criteria:**
- ✅ Goal saves successfully
- ✅ UI standardized with design tokens
- ✅ Schema fixed (description column added)
- Widget auto-created on dashboard
- Calculations are accurate
- Visual design is premium quality
- Updates automatically each day
- Shows actionable insights

**Completed:** October 24, 2025 (Schema fix + UI standardization)

---

### #33 - Reports: gerar, ver, baixar e enviar por e-mail
**Status:** ✅ Completed (Backend + UI ready)  
**Priority:** Critical  
**Complexity:** XL

**Problem:**  
No report generation system exists. Users cannot export or share their analytics.

**Objective:**  
Provide tangible deliverables and automated communication of results.

**Technical Actions:**
- ✅ Create database table (generated_reports)
- ✅ Build report generation edge function (ai-generate-report)
- ✅ Implement UI with design system tokens
- ✅ Preview and download functionality
- Create PDF template with:
  - User branding
  - Key metrics and charts
  - Performance summary
  - Goal progress
- Create XLSX export with raw data tables
- Set up email delivery (SMTP/SES)
  - Use no-reply sender
  - Professional email template
  - Attachment handling
- Add scheduling system (weekly/monthly automated reports)

**Acceptance Criteria:**
- ✅ Backend deployed and functional
- ✅ UI implemented with design tokens
- ✅ Reports saved to database
- ✅ AI-powered content generation working
- View button shows report preview
- Download works for PDF and XLSX
- Email sends successfully with attachment
- Scheduled reports work automatically
- History page is elegant and functional
- All data in reports is accurate

**Completed:** October 24, 2025 (Backend + UI, email pending)

**Dependencies:** Email service configuration for delivery feature

---

### #37 - IA contextual no parsing de imagem única + correção assistida
**Status:** ✅ Completed (Infrastructure + Feedback)  
**Priority:** Critical  
**Complexity:** XL

**Problem:**  
OCR doesn't learn user patterns. No way to correct unrecognized fields interactively.

**Objective:**  
Increase OCR accuracy and reduce friction through learning and assisted correction.

**Technical Actions:**
- ✅ Implement pattern learning system:
  - ✅ Track user's typical close times
  - ✅ Learn favorite leverage settings
  - ✅ Detect short/long preferences
  - ✅ Remember ROI patterns
  - ✅ Broker-specific layout learning
- ✅ Database table created: user_trade_patterns
- ✅ Database table created: ai_extraction_feedback
- ✅ Feedback component integrated into Upload page
- ✅ Thumbs up/down mechanism for extraction quality
- Build LLM integration for field inference
- Create interactive correction interface
- Develop confidence scoring
- Implement progressive learning from corrections

**Acceptance Criteria:**
- ✅ Pattern learning database infrastructure ready
- ✅ Feedback mechanism collects user corrections
- ✅ Data stored for future learning improvements
- LLM suggests correct values for low-confidence fields
- User can correct fields inline with dropdown hints
- AI learns from each correction
- Pattern DB grows with usage

**Completed:** October 24, 2025 (Infrastructure + Feedback system)

**Notes:** Foundation laid for AI learning. Pattern matching and LLM inference to be implemented in next phase.
- Create interactive correction UI:
  - Overlay on uploaded image
  - Click to map fields directly on image
  - Visual feedback for recognized vs. unrecognized
  - Save corrections to training data
- Implement learning loop (corrections improve future detections)
- Add confidence scores for each extracted field
- Support multiple broker layouts automatically

**Acceptance Criteria:**
- ✅ System pre-fills fields with high accuracy based on patterns
- ✅ User can correct fields by clicking on image
- ✅ Corrections improve future uploads
- ✅ Works across different broker interfaces
- ✅ Confidence indicators help user know what to review

**Dependencies:** LLM API, enhanced OCR system, user feedback storage

---

### #42 - Padronização global de UI/UX (cores, fontes, espaçamento)
**Status:** Planned  
**Priority:** Critical  
**Complexity:** L

**Problem:**  
Inconsistent visual design across pages (Goals, Reports, Forecast, Risk, Plan, etc.).

**Objective:**  
Increase consistency and perceived quality across entire platform.

**Technical Actions:**
- Centralize design tokens in index.css and tailwind.config.ts
- Define semantic color system (HSL only, no hardcoded colors)
- Standardize typography scale and weights
- Unify spacing system (consistent padding/margins)
- Review and replace old icons with consistent set
- Ensure high contrast (4.5:1 minimum) for Dark/Light modes
- Create component library documentation
- Audit all pages for compliance
- Fix any direct color usage (bg-white, text-black, etc.)

**Acceptance Criteria:**
- ✅ All sections follow same visual patterns
- ✅ Icons and fonts are consistent
- ✅ Spacing feels uniform across platform
- ✅ Dark/Light mode transitions smoothly
- ✅ No hardcoded colors in components
- ✅ Design system is documented

**Notes:** This is ongoing work that should be applied to every new feature.

---

## 🟠 HIGH PRIORITY (20 items)

### #1 - Selector de moeda + BTC/ETH
**Status:** Planned | **Complexity:** L

**Description:**  
Allow user to choose display currency (BRL, USD, EUR, etc.) and also view values in BTC/ETH across entire platform.

**Technical Actions:**
- Add currency selector component (header or settings)
- Store preference per user in database
- Implement conversion system with real-time rates API
- Apply conversion to all screens: Dashboard, Wallets, Analytics, Reports
- Add BTC/ETH toggle for crypto display
- Cache exchange rates (update hourly)

**Acceptance Criteria:**
- ✅ Currency change updates all values instantly
- ✅ Preference persists after logout/login
- ✅ Accurate conversion rates
- ✅ BTC/ETH display toggle works

---

### #2 - Fix layout de colunas do Dashboard
**Status:** Planned | **Complexity:** M

**Problem:**  
Custom 4-column dashboard reverts to 1 column when switching tabs.

**Technical Actions:**
- Persist layout to backend (user_preferences table)
- Prevent layout inheritance from other tabs
- Restore exact layout on component mount
- Add version tracking for layout configs
- Test with localStorage as backup

**Acceptance Criteria:**
- ✅ Returning to dashboard maintains configured columns
- ✅ Tab switching doesn't affect layout
- ✅ Layout survives browser refresh

---

### #4 - Consistência de idioma e domínio
**Status:** Planned | **Complexity:** M

**Description:**  
Synchronize language between landing, pricing, login, and platform. Flag switching adjusts domain/routes.

**Technical Actions:**
- Read language from URL path (/pt, /ar, /en)
- Implement automatic redirects based on language
- Persist language choice across session
- Update all i18n files for consistency
- Sync domain routing with language selection

**Acceptance Criteria:**
- ✅ Language doesn't change between pages
- ✅ Switching updates everything including domain
- ✅ Works across all public and authenticated pages

---

### #5 - Remoção de widget no Dashboard (botão interno)
**Status:** Planned | **Complexity:** S

**Problem:**  
"Widget Removed" message appears but widget remains visible.

**Technical Actions:**
- After successful API response (200), remove from local state
- Trigger grid reflow
- Ensure persistence after refresh
- Add optimistic UI update with rollback on error

**Acceptance Criteria:**
- ✅ Widget disappears immediately
- ✅ Doesn't reappear after reload
- ✅ State sync between UI and backend

---

### #7 - Campo de erro editável + customização de colunas no Trading History
**Status:** Planned | **Complexity:** M

**Description:**  
Edit "Error/Mistake" field per trade row and customize columns (show/hide and reorder).

**Technical Actions:**
- Add inline editing for Error field with autosave
- Build "Customize Columns" modal:
  - Checkboxes to show/hide columns
  - Drag & drop to reorder
- Persist per user
- Add keyboard shortcuts for faster editing

**Acceptance Criteria:**
- ✅ Error field saves and persists
- ✅ Column layout saves and applies correctly
- ✅ Smooth UX for customization

---

### #8 - Overview Dashboard totalmente customizável (Pro/Elite)
**Status:** Planned | **Complexity:** L

**Description:**  
Add widgets from Insights to Overview via "+" button. Allow full reordering and removal. Basic tier keeps fixed layout.

**Technical Actions:**
- Add "+" button to each Insights metric
- Implement drag & drop for widgets
- Save custom layouts per user
- Restrict Basic tier to fixed layout
- Add widget gallery/library

**Acceptance Criteria:**
- ✅ Pro/Elite can fully customize
- ✅ Basic tier remains fixed
- ✅ Changes persist across sessions

---

### #12 - Toggle 'Blur Sensitive Data' em todas as seções
**Status:** Planned | **Complexity:** M

**Description:**  
Add visible blur toggle in Overview, Insights, Trading History, SpotWallet, and Analytics.

**Technical Actions:**
- Place toggle next to timeframe selector
- Apply CSS blur to numerical values
- Don't blur labels/headers
- Persist toggle state globally
- Sync across all sections

**Acceptance Criteria:**
- ✅ Toggle appears and works in all sections
- ✅ State persists and synchronizes
- ✅ Only numbers are blurred, not labels

---

### #13 - Master Toggle global de Blur
**Status:** Planned | **Complexity:** M

**Description:**  
Global blur toggle in top menu (next to "Hello, ...") that applies platform-wide, with local page overrides possible.

**Technical Actions:**
- Create global context/state for blur
- Add toggle to header/menu
- Sync with local toggles (#12)
- Persist between sessions
- Allow page-level overrides

**Acceptance Criteria:**
- ✅ Master toggle applies blur everywhere
- ✅ Pages can override locally
- ✅ State persists across sessions

---

### #14 - Fix remover widgets via 'Customizar Página'
**Status:** Planned | **Complexity:** S

**Problem:**  
Widget removal via customization modal doesn't update grid.

**Technical Actions:**
- Unify removal handlers (widget X button + modal)
- Update state and layout immediately
- Confirm removal with backend
- Add animation for smooth removal

**Acceptance Criteria:**
- ✅ Removes immediately via both methods
- ✅ No ghost spaces left
- ✅ Doesn't reappear on refresh

---

### #20 - Deleted History (Upload) com restauração 48h
**Status:** Planned | **Complexity:** M

**Description:**  
Separate Upload History from Trade History. Allow delete with 48h restore window.

**Technical Actions:**
- Move deleted uploads to temporary table (soft delete)
- Add "Deleted History" link/page
- Implement "Restore" button
- Create cron job for 48h permanent deletion
- Ensure trades remain intact when upload is deleted

**Acceptance Criteria:**
- ✅ Can restore within 48h
- ✅ After 48h, permanent deletion
- ✅ Trades are not affected by upload deletion

---

### #22 - Emoções & Tags integradas ao Psychology Report
**Status:** Planned | **Complexity:** M

**Description:**  
Emotions and Errors become tags. Cross-analyze with performance data.

**Technical Actions:**
- Create base multilingual emotion/error tag list
- Implement multi-select tagging system
- Allow custom tag creation
- Cross-reference tags with P&L and time data
- Build charts/insights for Psychology Report
- Show correlations between emotions and results

**Acceptance Criteria:**
- ✅ Psychology Report shows emotion/performance correlations
- ✅ Tags persist and are reusable
- ✅ Visual insights are clear and actionable

---

### #24 - Remover 'Trade Analysis' e 'Compare Trades' + links do User Guide
**Status:** Planned | **Complexity:** M

**Description:**  
Hide incomplete modules. Add "Learn More" links to User Guide in active sections, focus on Risk.

**Technical Actions:**
- Remove Trade Analysis and Compare Trades components
- Validate all Risk calculation formulas
- Add contextual "Learn More" links per metric
- Link to specific User Guide sections
- Ensure no broken routes

**Acceptance Criteria:**
- ✅ No incomplete modules visible
- ✅ Links open correct User Guide section
- ✅ Risk calculations reviewed and correct

---

### #25 - Risk Management: Stop & Leverage Calculators + novo Drawdown
**Status:** Planned | **Complexity:** L

**Description:**  
Replace confusing logic with useful calculators. Redesign Drawdown. Remove "Limite" section.

**Technical Actions:**
- Implement Stop Loss Calculator
- Implement Leverage Calculator
- Validate all formulas (use official Gustavo spreadsheet as reference)
- Redesign Drawdown visual for Dark/Light modes
- Add tooltips and contextual help links
- Remove "Limite" component

**Acceptance Criteria:**
- ✅ Calculators work correctly
- ✅ Drawdown is elegant and clear
- ✅ "Limite" is removed
- ✅ All formulas validated against reference

---

### #27 - Pop-up diário 'Lesson Learned' com press-and-hold
**Status:** Planned | **Complexity:** M

**Description:**  
Daily summary of yesterday's and last week's errors. Close only by holding button for 5 seconds.

**Technical Actions:**
- Trigger popup once per day (on first visit)
- Pull error data from tags and trades
- Create press-and-hold button with animation
- Log confirmation when user completes hold
- Prevent re-showing same day

**Acceptance Criteria:**
- ✅ Popup appears once per day
- ✅ Only closes after 5s hold
- ✅ Confirmation is logged
- ✅ Content is relevant and data-driven

---

### #28 - Alerts do Long/Short Ratio com push (Pro/Elite)
**Status:** Planned | **Complexity:** L

**Description:**  
Notify users of ±5% changes in Long/Short Ratio at 5/10/15/60min intervals via Web Push.

**Technical Actions:**
- Set up Binance API polling
- Configure thresholds and intervals per user
- Implement Web Push notifications
- Add cooldown to prevent spam
- Log all alerts sent
- Create settings page for alert preferences

**Acceptance Criteria:**
- ✅ Alerts sent to desktop
- ✅ Settings persist
- ✅ No duplicate alerts (cooldown works)
- ✅ Only Pro/Elite users have access

**Dependencies:** Web Push API, notification permissions

---

### #35 - Acessibilidade (WCAG 2.1 AA) + User Guide
**Status:** Planned | **Complexity:** XL

**Description:**  
Accessibility plan with ARIA, keyboard navigation, screen readers, and guide page.

**Technical Actions:**
- Add semantic HTML throughout
- Implement ARIA labels and roles
- Ensure full keyboard navigation
- Add high contrast mode
- Support adjustable font sizes
- Test with NVDA and VoiceOver
- Create accessibility guide page

**Acceptance Criteria:**
- ✅ Keyboard navigation works everywhere
- ✅ Screen readers describe all elements
- ✅ Accessibility guide page published
- ✅ WCAG 2.1 AA compliance verified

---

### #38 - Persistência do layout do Dashboard após reload
**Status:** Planned | **Complexity:** M

**Problem:**  
Even after saving custom layout, page reload resets column count.

**Technical Actions:**
- Save layout to backend/localStorage
- Restore automatically on component mount
- Validate against cache
- Add fallback for corrupted state

**Acceptance Criteria:**
- ✅ Page reload maintains columns and widget order
- ✅ Works consistently across browsers

---

### #39 - Validação de métricas de risco (Overview)
**Status:** Planned | **Complexity:** M

**Description:**  
Review formulas for Weekly, Cumulative, and Open Position Risk. Document in User Guide.

**Technical Actions:**
- Audit all risk calculation formulas
- Compare with reference spreadsheet
- Generate technical documentation
- Add "Learn More" links to User Guide
- Fix any incorrect calculations

**Acceptance Criteria:**
- ✅ Calculations reviewed and documented
- ✅ Explanations accessible via "Learn More"
- ✅ All formulas match reference standards

---

### #40 - Links contextuais 'Learn More' em toda a plataforma
**Status:** Planned | **Complexity:** M

**Description:**  
Add direct links to User Guide on metrics, charts, and key fields.

**Technical Actions:**
- Map all sections and metrics
- Add tooltip/link components
- Synchronize with User Guide structure
- Ensure deep linking works
- Test all links

**Acceptance Criteria:**
- ✅ All "Learn More" links go to correct section
- ✅ No broken links
- ✅ Consistent placement and styling

---

### #41 - Usar planilha oficial do Gustavo como base do Stop Calculator
**Status:** Planned | **Complexity:** S

**Description:**  
Import and validate formulas from provided spreadsheet for precise stop and risk calculations.

**Technical Actions:**
- Read official spreadsheet
- Implement identical formulas
- Run precision tests with 10 practical cases
- Document formula sources
- Add unit tests

**Acceptance Criteria:**
- ✅ Calculator results identical to reference spreadsheet
- ✅ All test cases pass
- ✅ Formulas documented

---

## 🟡 MEDIUM PRIORITY (14 items)

### #3 - Recompensa por compartilhamento semanal
**Status:** Planned | **Complexity:** M

**Description:**  
1 bonus upload per week per eligible social network when user shares.

**Technical Actions:**
- Add share buttons for each network
- Implement callback/registration of share event
- Create weekly counter per network
- Add weekly reset mechanism
- Track in database

**Acceptance Criteria:**
- ✅ User receives +1 upload per network/week
- ✅ Weekly reset works correctly

---

### #6 - Ordenação no Trading History
**Status:** Planned | **Complexity:** S

**Description:**  
Enable sorting on P&L, Size, Funding Fee, Trading Fee, and Date columns.

**Technical Actions:**
- Add sort asc/desc with direction icon
- Persist sort order during session
- Ensure performance with large datasets
- Add visual feedback

**Acceptance Criteria:**
- ✅ Click reorders correctly
- ✅ Clear visual feedback
- ✅ Consistent on desktop/mobile

---

### #10 - Remover Gamification (manter Badges)
**Status:** Planned | **Complexity:** M

**Description:**  
Hide Level/XP/Challenges and ⚡ icon. Keep only Badges/Achievements. Preserve backend data.

**Technical Actions:**
- Disable gamification components on frontend
- Maintain backend data and tables
- Ensure Badges component still functions
- Add feature flag for potential re-enable

**Acceptance Criteria:**
- ✅ No Level/XP/Challenge visuals
- ✅ Badges continue to work
- ✅ No data loss

---

### #11 - SpotWallet: preço automático + remover Quick Select
**Status:** Planned | **Complexity:** M

**Description:**  
When typing symbol (e.g., ADA), auto-fill Token Name, current Purchase Price via CoinGecko, and Purchase Date = today. Remove Quick Select dropdown.

**Technical Actions:**
- Integrate CoinGecko API
- Auto-fill fields on symbol entry
- Allow manual editing
- Remove Quick Select component

**Acceptance Criteria:**
- ✅ ADA fills Cardano, current price, and today's date
- ✅ Smooth UX
- ✅ Quick Select removed

---

### #16 - Dark mode em Portfolio > Exchanges
**Status:** Planned | **Complexity:** S

**Problem:**  
Exchange cards are white in Dark mode. Logos lose readability.

**Technical Actions:**
- Change background to gray (#2A-#3A range)
- Add subtle border
- Test dark logos for legibility
- Ensure responsive
- Keep Light mode white

**Acceptance Criteria:**
- ✅ Consistent visual in Dark mode
- ✅ Logos are legible
- ✅ Light mode unchanged

---

### #18 - Remover módulo 'Trading Account' (fase 1)
**Status:** Planned | **Complexity:** S

**Problem:**  
Incomplete form. "Create Account" button does nothing.

**Technical Actions:**
- Remove from frontend
- Keep backend/schemas inactive
- Create task for future redesign

**Acceptance Criteria:**
- ✅ No menu/form visible
- ✅ No errors
- ✅ Roadmap updated

---

### #21 - Campo 'Setup' e '+ Add Broker' no upload
**Status:** Planned | **Complexity:** M

**Description:**  
Add Setup field to trade. Allow creating Broker if it doesn't exist.

**Technical Actions:**
- Add dropdown with "+ Add" option
- Modal for new item creation
- Auto-save and select new item
- Prevent duplicates

**Acceptance Criteria:**
- ✅ New setups/brokers appear and are selectable
- ✅ Saved per user

---

### #23 - Pós-salvamento de trade: pop-up de escolha
**Status:** Planned | **Complexity:** S

**Problem:**  
Automatic redirect to Dashboard after save doesn't respect user flow.

**Technical Actions:**
- Show modal with options:
  - "Go to Dashboard"
  - "Go to Trade History"
  - "Stay Here"
- Optional timeout (5s default)

**Acceptance Criteria:**
- ✅ No automatic redirect
- ✅ User chooses destination
- ✅ Consistent across all languages

---

### #26 - Trading Journal: Tags unificadas
**Status:** Planned | **Complexity:** M

**Description:**  
In "New Trading Journal", Tags include Setups, Emotions, Errors, and custom tags.

**Technical Actions:**
- Build autocomplete multi-source system
- Categorize tags by color
- Allow tag creation with category
- Sync with Insights

**Acceptance Criteria:**
- ✅ Journal tags appear globally
- ✅ Analyses read these tags

---

### #29 - Forecast (Analytics): refino visual
**Status:** Planned | **Complexity:** S

**Description:**  
Keep calculations. Improve typography, colors, spacing, and responsiveness.

**Technical Actions:**
- Improve visual hierarchy
- Ensure 4.5:1 contrast
- Add tooltips
- Modernize sliders
- Test Dark/Light modes

**Acceptance Criteria:**
- ✅ Premium visual and responsive
- ✅ Same metrics maintained

---

### #30 - Remover 'Economic Calendar' e 'Performance Alert' (Analytics)
**Status:** Planned | **Complexity:** S

**Description:**  
Hide modules and keep in backlog for phase 2.

**Technical Actions:**
- Remove components
- Preserve code
- Update routes/history

**Acceptance Criteria:**
- ✅ Not visible in UI
- ✅ No errors
- ✅ Backlog updated

---

### #32 - Trading Plan reformulado (Setups reais + tipo de ativo)
**Status:** Planned | **Complexity:** M

**Description:**  
Replace "Rules" with "Trade Setups". Replace "Markets" with Currency Type (BTC/ETH/Top10/Small Caps).

**Technical Actions:**
- Add Setup, Rules, Risks, Checklist fields
- Implement rich text editor
- Save/edit/delete functionality
- Plan for future Upload integration

**Acceptance Criteria:**
- ✅ Plans save correctly
- ✅ Editor functional
- ✅ Ready for Upload integration

---

### #34 - Social/Comunidade: focar em Badges + Share no X
**Status:** Planned | **Complexity:** M

**Description:**  
Leave Social and Leaderboard as disabled "Zoom". Keep Achievements and X sharing.

**Technical Actions:**
- Add "Share on X" button per badge
- Generate dynamic tweet text with link and @TheTradingDiary
- Log share events
- Hide extra social modules

**Acceptance Criteria:**
- ✅ Tweet opens with correct text
- ✅ Premium visual
- ✅ No extra social modules

---

### #36 - Progress IXP: colocar como 'Zoom' e ocultar
**Status:** Planned | **Complexity:** S

**Description:**  
Make IXP progress as non-clickable zoom. Move visual development to backlog.

**Technical Actions:**
- Hide interactions
- Add "Zoom" disabled tag
- Register redesign task

**Acceptance Criteria:**
- ✅ Nothing clickable
- ✅ No errors
- ✅ Item listed in future backlog

---

## ✅ COMPLETED ITEMS

### Broker Selection in Trading History
**Completed:** October 2025  
**Description:** Added broker filter dropdown to Trading History with "All Brokers" fallback option.

---

## 📝 TECHNICAL DEBT & NOTES

### Missing Documentation
- Phase 8 implementation details (gap in documentation)
- Phase 9 implementation details (gap in documentation)
- Phases 11+ planning not started

### Database Optimizations Needed
- Review indexes on high-traffic tables (trades, uploads)
- Optimize queries for large datasets
- Consider archiving old data

### Code Quality
- Centralize design tokens (ongoing with #42)
- Eliminate direct color usage in components
- Standardize error handling patterns
- Add comprehensive unit test coverage

### Infrastructure
- Set up automated backups
- Configure monitoring and alerting
- Document disaster recovery procedures

---

## 🎯 IMPLEMENTATION PRIORITIES FOR NEXT SPRINT

**Week 1-2:**
1. #17 - Fix API import (Critical blocker)
2. #15 - Timeframe single day selection (Critical blocker)
3. #9 - Trading Assistant with LLM (Start integration)

**Week 3-4:**
1. #31 - Goals widget + projection
2. #19 - Premium Upload UX
3. #42 - UI/UX standardization (ongoing)

**Week 5-6:**
1. #33 - Reports generation system
2. #37 - AI contextual image parsing
3. #1 - Currency selector + BTC/ETH display

---

## 📚 REFERENCES

- **Phase Documentation:** See `PHASE_*_COMPLETE.md` files
- **Database Schema:** Check Supabase migrations
- **Design System:** `src/index.css` and `tailwind.config.ts`
- **API Documentation:** Exchange adapter files in `supabase/functions/_shared/adapters/`

---

**Next Review Date:** November 1, 2025  
**Backlog Owner:** Product Team  
**Last Modified By:** AI Assistant