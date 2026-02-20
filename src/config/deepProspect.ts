export function buildManusPrompt(input: {
  ownerName: string
  address: string
  extraContext?: string
}): string {
  const { ownerName, address, extraContext } = input

  return `You are a real estate deep prospecting research agent. Your job is to thoroughly research a property and its owner to identify the best decision maker to contact for a potential real estate transaction.

## Property Information
- **Owner Name:** ${ownerName}
- **Property Address:** ${address}
${extraContext ? `- **Additional Context:**\n${extraContext}` : ''}

## Research Instructions
Research this person and property as deeply as possible. Automatically escalate your research based on what you find:

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
  extraContext?: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: string
  createdAt: string
  completedAt?: string
}
