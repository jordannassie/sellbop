import type { IntegrationMeta, ResourceBlock, ResourceCardRow, ResourcePageRow } from './types'

const CLAUDE_IMG = 'https://qsvmgzdaashfsavmfjuz.supabase.co/storage/v1/object/public/SELL/images/Tools/claude-ai-logo-rounded-hd-free-png.webp'
const HIGGSFIELD_IMG = 'https://qsvmgzdaashfsavmfjuz.supabase.co/storage/v1/object/public/SELL/images/Tools/output.webp'

export const INTEGRATIONS: Record<string, IntegrationMeta> = {
  claude: {
    name: 'Claude',
    badge: 'AI Agent',
    headline: 'Tell Claude what you want to sell.',
    description:
      'Claude can help research ideas, create product content, build files, write listings, configure pricing, set affiliate commissions, upload assets, and manage products inside SellBop.',
    image_url: CLAUDE_IMG,
    features: [
      'Research product ideas',
      'Write product content',
      'Create guides and PDFs',
      'Create templates and files',
      'Write product descriptions',
      'Set pricing',
      'Configure affiliate commissions',
      'Upload product assets',
      'Save products as drafts',
      'Publish products',
    ],
    prompt:
      'Create me a $49 digital product for Airbnb hosts. Build the product files, write the SellBop listing, set the price to $49, turn affiliates on at 30%, and save everything as a draft for me to review.',
    steps_title: 'How does this work?',
    steps: [
      'Connect SellBop as a tool in your Claude account.',
      'Once connected, Claude can securely create and manage products in your SellBop store using your SellBop account permissions.',
    ],
    cta_text: 'Connect Claude',
    cta_url: '/dashboard/settings/ai-integrations',
    powered_by: 'Powered by MCP',
  },
  higgsfield: {
    name: 'Higgsfield',
    badge: 'Images + Video',
    headline: 'Create the visuals for your products.',
    description:
      'Use Higgsfield with Claude to generate professional images and videos for the digital products you\'re building.',
    image_url: HIGGSFIELD_IMG,
    features: [
      'Product covers',
      'Marketplace thumbnails',
      'Product mockups',
      'Promotional graphics',
      'Social media creatives',
      'Lifestyle images',
      'Product videos',
      'Ad creatives',
    ],
    flow: 'Claude creates the product → Higgsfield creates the visuals → Claude uploads everything to SellBop → You review and publish',
    steps_title: 'Connect Higgsfield to Claude',
    steps: [
      'Open Higgsfield MCP at higgsfield.ai/mcp',
      'Copy the Higgsfield connector URL: https://mcp.higgsfield.ai/mcp',
      'Open Claude',
      'Go to Customize → Connectors',
      'Add a custom connector named Higgsfield',
      'Paste the Higgsfield MCP URL',
      'Sign into Higgsfield if prompted',
      'Claude can now use Higgsfield to create product images and videos',
    ],
    cta_text: 'Connect Higgsfield',
    cta_url: 'https://higgsfield.ai/mcp',
    external_url: 'https://higgsfield.ai/mcp',
    powered_by: 'Powered by MCP',
  },
}

export const DEFAULT_HOME_CARDS: Omit<ResourceCardRow, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    page_slug: 'home',
    title: 'Connect Your AI',
    subtitle: 'Build products with Claude + Higgsfield',
    description:
      'Connect the AI tools you already use and let them help create complete digital products for your SellBop store.',
    icon: 'sparkles',
    image_url: null,
    cta_text: 'Get Started',
    cta_url: '/dashboard/resources/connect-ai',
    sort_order: 1,
    is_published: true,
    metadata: {},
  },
  {
    page_slug: 'home',
    title: 'Affiliate Program',
    subtitle: 'Let other people sell your products',
    description:
      'Turn on affiliates, choose a commission, and let other creators earn money promoting your products.',
    icon: 'trending-up',
    image_url: null,
    cta_text: 'Learn How',
    cta_url: '/dashboard/resources/affiliates',
    sort_order: 2,
    is_published: true,
    metadata: {},
  },
  {
    page_slug: 'home',
    title: 'Get More Sales',
    subtitle: 'Simple ways to promote your products',
    description:
      'Learn how to use social media, DMs, affiliates, email, content, and paid traffic to get people to your SellBop products.',
    icon: 'megaphone',
    image_url: null,
    cta_text: 'View Playbook',
    cta_url: '/dashboard/resources/get-more-sales',
    sort_order: 3,
    is_published: true,
    metadata: {},
  },
  {
    page_slug: 'home',
    title: 'What Should I Sell?',
    subtitle: 'Digital product ideas you can create today',
    description:
      'Explore PDFs, templates, spreadsheets, calculators, guides, prompt packs, graphics, videos, software, and more.',
    icon: 'lightbulb',
    image_url: null,
    cta_text: 'Explore Ideas',
    cta_url: '/dashboard/resources/product-ideas',
    sort_order: 4,
    is_published: true,
    metadata: {},
  },
]

export const DEFAULT_RESOURCE_PAGES: Omit<ResourcePageRow, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    slug: 'connect-ai',
    title: 'Connect Your AI',
    subtitle: 'Claude builds the product. Higgsfield creates the visuals. SellBop helps you sell it.',
    category: 'ai',
    icon: 'sparkles',
    image_url: null,
    sort_order: 1,
    is_published: true,
    content_json: {
      blocks: [
        { type: 'integration', key: 'claude' },
        { type: 'integration', key: 'higgsfield' },
        {
          type: 'workflow',
          title: 'One Prompt. Complete Product.',
          steps: [
            { title: 'Tell Claude what to build', example: 'Create a digital product for real estate agents.' },
            { title: 'Claude creates the product', bullets: ['title', 'content', 'files', 'listing', 'pricing'] },
            { title: 'Higgsfield creates the visuals', bullets: ['cover', 'mockups', 'social graphics', 'video'] },
            { title: 'Claude adds everything to SellBop' },
            { title: 'Turn on affiliates' },
            { title: 'Review & Publish' },
          ],
        },
      ],
    },
  },
  {
    slug: 'affiliates',
    title: 'Make Money With Affiliates',
    subtitle: 'Let other people promote your products and earn a commission when they generate a sale.',
    category: 'affiliates',
    icon: 'trending-up',
    image_url: null,
    sort_order: 2,
    is_published: true,
    content_json: {
      blocks: [
        {
          type: 'workflow',
          title: 'How SellBop Affiliates Work',
          steps: [
            { title: 'You create a product' },
            { title: 'Turn Affiliates ON' },
            { title: 'Choose a commission' },
            { title: 'Affiliates share your product' },
            { title: 'Customer buys' },
            { title: 'You both earn' },
          ],
        },
        {
          type: 'commission_example',
          price: '$49',
          percent: '30%',
          earns: '$14.70',
          note: 'Seller receives the remaining amount before applicable payment processing fees.',
        },
        {
          type: 'steps',
          title: 'How to Turn Affiliates On',
          items: [
            'Open Products in your dashboard',
            'Select a product to edit',
            'Find the Sellbop Share section',
            'Turn Affiliate Sharing ON',
            'Choose your commission percentage (10%–50%)',
            'Save your product',
          ],
        },
        {
          type: 'text',
          title: 'How Affiliates Promote Your Product',
          body:
            'Affiliates get a unique SellBop referral link and share it through Instagram, TikTok, YouTube, Facebook, X, email, blogs, communities, DMs, and paid promotions where allowed.',
        },
        {
          type: 'text',
          title: 'Why Affiliates Matter',
          body:
            'Instead of being the only person promoting your product, SellBop lets other people sell with you. The more people sharing your products, the more opportunities you have to make sales.',
        },
        { type: 'cta', text: 'Manage Affiliates', url: '/dashboard/affiliates', variant: 'primary' },
      ],
    },
  },
  {
    slug: 'get-more-sales',
    title: 'Get More Sales',
    subtitle: 'Simple ways to get more people seeing and buying your products.',
    category: 'marketing',
    icon: 'megaphone',
    image_url: null,
    sort_order: 3,
    is_published: true,
    content_json: {
      blocks: [
        {
          type: 'channels',
          title: 'Promotion Playbook',
          items: [
            { title: 'Share Your Link', body: 'Copy your SellBop product link and share it anywhere.' },
            { title: 'Instagram', body: 'Add your product link to your bio, Stories, Reels, posts, and DMs.' },
            { title: 'TikTok', body: 'Create simple content around the problem your product solves and direct viewers to your SellBop link.' },
            { title: 'YouTube', body: 'Use videos, Shorts, descriptions, and pinned comments to promote your products.' },
            { title: 'DMs', body: 'Use direct messages to send interested people to the right product. Tools like ManyChat can help automate conversations.' },
            { title: 'Email', body: 'Share new products, launches, offers, and bundles with your audience.' },
            { title: 'Affiliates', body: 'Recruit people who already have audiences to promote your products for a commission.' },
            { title: 'Meta Ads', body: 'Run paid ads directly to a product offer when appropriate.' },
          ],
        },
        {
          type: 'text',
          title: 'Start Simple',
          body:
            'You do not need to do everything. Start with one product and one traffic source. Then add affiliates. Then scale what works.',
        },
      ],
    },
  },
  {
    slug: 'product-ideas',
    title: 'What Should I Sell?',
    subtitle: 'If you can put it in a file, you can sell it on SellBop.',
    category: 'ideas',
    icon: 'lightbulb',
    image_url: null,
    sort_order: 4,
    is_published: true,
    content_json: {
      blocks: [
        {
          type: 'product_categories',
          categories: [
            { title: 'eBooks & PDFs', description: 'Guides, reports, workbooks, playbooks, educational resources.', icon: 'book' },
            { title: 'Templates & Spreadsheets', description: 'Calculators, trackers, planners, dashboards, budgeting tools.', icon: 'table' },
            { title: 'Guides & Checklists', description: 'Step-by-step instructions, processes, SOPs, launch checklists.', icon: 'list' },
            { title: 'Prompt Packs', description: 'AI prompts for specific industries, jobs, workflows, or outcomes.', icon: 'sparkles' },
            { title: 'Design Assets', description: 'Graphics, mockups, icons, social templates, branding assets.', icon: 'palette' },
            { title: 'Photography', description: 'Stock photos, backgrounds, collections, niche image packs.', icon: 'camera' },
            { title: 'Presets & Filters', description: 'Photo presets, video presets, editing templates.', icon: 'sliders' },
            { title: 'Audio & Music', description: 'Music tracks, sound effects, audio packs.', icon: 'music' },
            { title: 'Software & Scripts', description: 'Small applications, scripts, tools, plugins, automations.', icon: 'code' },
            { title: 'Video', description: 'Training, tutorials, video packs, creative assets.', icon: 'video' },
            { title: 'Courses & Lessons', description: 'Educational content packaged digitally.', icon: 'graduation' },
            { title: 'Data & Reports', description: 'Research, niche data, reports, industry information.', icon: 'chart' },
            { title: 'And More', description: 'Anything digital that can be delivered to a customer.', icon: 'plus' },
          ],
        },
        {
          type: 'prompts_list',
          title: "Don't know what to create? Ask Claude.",
          prompts: [
            'Give me 10 digital product ideas for realtors that could sell for $29–$99.',
            'Create a digital product idea for Airbnb hosts that saves them time or helps them make more money.',
            'Turn my expertise in fitness into 5 digital products I could sell online.',
            'Find something useful I could create as a spreadsheet or calculator for small business owners.',
          ],
          cta_text: 'Build With Claude',
          cta_url: '/dashboard/settings/ai-integrations',
        },
      ],
    },
  },
]

export function withDefaults<T extends { id?: string; created_at?: string; updated_at?: string }>(
  rows: Omit<T, 'id' | 'created_at' | 'updated_at'>[],
): T[] {
  const now = new Date().toISOString()
  return rows.map((row, i) => ({
    ...row,
    id: `default-${i}`,
    created_at: now,
    updated_at: now,
  })) as T[]
}
