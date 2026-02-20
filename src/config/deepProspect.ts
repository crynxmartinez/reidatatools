export type LeadType = 'foreclosure' | 'probate' | 'obituary' | 'tax_sale' | 'eviction' | 'other'
export type DistressLevel = 'auto' | '1' | '2' | '3' | '4'

export const LEAD_TYPE_OPTIONS: { value: LeadType; label: string }[] = [
  { value: 'foreclosure', label: 'Foreclosure' },
  { value: 'probate', label: 'Probate' },
  { value: 'obituary', label: 'Obituary / Pre-Probate' },
  { value: 'tax_sale', label: 'Tax Sale' },
  { value: 'eviction', label: 'Eviction' },
  { value: 'other', label: 'Other' },
]

export const DISTRESS_LEVEL_OPTIONS = [
  { value: 'auto', label: 'Auto-detect (recommended)' },
  { value: '1', label: 'Level 1 — Surface (owner alive, basic contact)' },
  { value: '2', label: 'Level 2 — Title & deed chain, liens, divorce' },
  { value: '3', label: 'Level 3 — Deceased owner, heir map, executor' },
  { value: '4', label: 'Level 4 — Complex title, entity/trust ownership' },
]

export function buildManusPrompt(input: {
  ownerName: string
  address: string
  leadType: LeadType
  distressLevel: DistressLevel
  extraContext?: string
}): string {
  const { ownerName, address, leadType, distressLevel, extraContext } = input

  const levelInstruction = distressLevel === 'auto'
    ? `Automatically determine the appropriate distress level (1–4) based on your research findings:
- Level 1: Owner is alive, property is straightforward — find current contact info and phone numbers
- Level 2: Complex title history — research deed chain, liens, judgments, divorce filings
- Level 3: Owner is deceased — build full heir map, identify executor/PR of estate, find decision maker contact info
- Level 4: Entity or trust ownership — identify signing members, beneficial owners, decision makers`
    : `Research at Level ${distressLevel} of deep prospecting:
${distressLevel === '1' ? '- Verify owner is alive, find current address and phone numbers, basic property info' : ''}
${distressLevel === '2' ? '- Research full deed chain and title history, find liens, judgments, divorce filings, verify ownership' : ''}
${distressLevel === '3' ? '- Owner may be deceased — search obituaries, probate filings, identify heirs, executor/PR of estate, build family tree and find decision maker contact info' : ''}
${distressLevel === '4' ? '- Entity or trust owns the property — identify all signing members, beneficial owners, trustees, and decision makers with contact info' : ''}`

  return `You are a real estate deep prospecting research agent. Your job is to thoroughly research a property and its owner to identify the best decision maker to contact for a potential real estate transaction.

## Property Information
- **Owner Name:** ${ownerName}
- **Property Address:** ${address}
- **Lead Type:** ${leadType.replace('_', ' ').toUpperCase()}
${extraContext ? `- **Additional Context:**\n${extraContext}` : ''}

## Research Instructions
${levelInstruction}

## Required Research Steps
Please execute ALL of the following steps and report findings for each:

### Step 1 — Owner Verification
- Confirm the owner's full legal name and current status (alive or deceased)
- Search public records, obituaries, social media, and news sources
- If deceased, note the date of death and source

### Step 2 — Property & Title Research
- Look up the property at the given address
- Find the current assessed value, last sale price, and sale date
- Research the full deed chain and ownership history
- Identify any liens, judgments, mortgages, or encumbrances
- Note any foreclosure filings, lis pendens, or court actions
- Check for divorce filings involving the owner

### Step 3 — Decision Maker Identification
- If owner is alive: find their current mailing address, phone numbers, and email
- If owner is deceased:
  - Search for obituaries and identify all surviving family members
  - Build a family tree / heir map (spouse, children, siblings, parents)
  - Identify the executor or Personal Representative (PR) of the estate from probate filings
  - Find the decision maker's name, relationship to deceased, current address, and contact info
  - Note confidence level (Confirmed / Likely) for each finding
- If entity/trust: identify signing members and beneficial owners

### Step 4 — Contact Intelligence
- Provide the best person to contact and their relationship to the property
- List all found phone numbers with type (mobile/landline) and last active date if available
- List any email addresses found
- Provide the mailing address for the decision maker (NOT the property address if owner is deceased)
- Suggest the best outreach approach (mail, phone, etc.)

### Step 5 — Comparable Sales (ARV)
- Find 3–5 comparable sales within 1 mile and last 6 months
- Estimate the After Repair Value (ARV) range
- Note the property's estimated condition if discernible

## Output Format
Structure your final report with these exact sections:
1. **Summary** — 2-3 sentence overview of findings and distress level selected
2. **Owner Status** — alive/deceased, verification source
3. **Property & Title** — value, liens, deed chain highlights
4. **Heir Map / Family Tree** — (if applicable) visual or list format
5. **Decision Maker** — name, relationship, confidence level, address, phone(s), email(s)
6. **Comparable Sales** — table of comps and ARV estimate
7. **Recommended Next Steps** — specific action items

Be thorough, cite your sources, and flag anything uncertain with a confidence level.`
}

export interface DeepProspectJob {
  id: string
  taskId: string
  ownerName: string
  address: string
  leadType: LeadType
  distressLevel: DistressLevel
  extraContext?: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: string
  createdAt: string
  completedAt?: string
}
