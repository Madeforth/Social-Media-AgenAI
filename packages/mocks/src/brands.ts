import type { Brand, BrandAsset, BrandGuidelines, Organization } from '@apex/types';

import { fromNow } from './time';

export const MOCK_ORGANIZATION: Organization = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Apex Studio',
  owner_user_id: '99999999-9999-4999-8999-999999999999',
  created_at: fromNow({ days: -120 }),
  updated_at: fromNow({ days: -120 }),
};

export const MOCK_BRANDS: Brand[] = [
  {
    id: '22222222-2222-4222-8222-222222222222',
    organization_id: MOCK_ORGANIZATION.id,
    name: 'Apex Flow',
    slug: 'apex-flow',
    description: 'Premium motorcycle technology.',
    status: 'ACTIVE',
    created_at: fromNow({ days: -120 }),
    updated_at: fromNow({ days: -3 }),
  },
];

export const MOCK_BRAND = MOCK_BRANDS[0]!;

/**
 * Guidelines are left largely empty on purpose. The Brand Brain is filled in by
 * the owner, and inventing a mission statement here would put words in the
 * brand's mouth. The screens are built to show their empty states.
 */
export const MOCK_BRAND_GUIDELINES: BrandGuidelines = {
  id: '33333333-3333-4333-8333-333333333333',
  brand_id: MOCK_BRAND.id,
  mission: null,
  vision: null,
  positioning: null,
  target_audience: null,
  tone_of_voice: null,
  visual_rules: null,
  copy_rules: null,
  forbidden_claims: [],
  content_pillars: [
    {
      key: 'product',
      name: 'Product',
      description: 'What the product does and why it matters.',
      target_share: 0.3,
    },
    {
      key: 'community',
      name: 'Community',
      description: 'Riders, routes and shared experience.',
      target_share: 0.3,
    },
    {
      key: 'education',
      name: 'Education',
      description: 'Practical knowledge for riders.',
      target_share: 0.2,
    },
    {
      key: 'brand',
      name: 'Brand',
      description: 'Point of view, manifesto and identity.',
      target_share: 0.2,
    },
  ],
  created_at: fromNow({ days: -120 }),
  updated_at: fromNow({ days: -3 }),
};

export const MOCK_BRAND_ASSETS: BrandAsset[] = [
  {
    id: '44444444-4444-4444-8444-444444444401',
    brand_id: MOCK_BRAND.id,
    asset_type: 'LOGO',
    name: 'Primary logo',
    storage_path: `${MOCK_BRAND.id}/logo/primary.svg`,
    metadata: { width: 512, height: 512 },
    created_at: fromNow({ days: -110 }),
    updated_at: fromNow({ days: -110 }),
  },
  {
    id: '44444444-4444-4444-8444-444444444402',
    brand_id: MOCK_BRAND.id,
    asset_type: 'PRODUCT_UI',
    name: 'Ride dashboard screen',
    storage_path: `${MOCK_BRAND.id}/product-ui/ride-dashboard.png`,
    metadata: { width: 1170, height: 2532 },
    created_at: fromNow({ days: -40 }),
    updated_at: fromNow({ days: -40 }),
  },
  {
    id: '44444444-4444-4444-8444-444444444403',
    brand_id: MOCK_BRAND.id,
    asset_type: 'LIFESTYLE',
    name: 'Mountain pass at dusk',
    storage_path: `${MOCK_BRAND.id}/lifestyle/mountain-pass.jpg`,
    metadata: { width: 4000, height: 2667 },
    created_at: fromNow({ days: -22 }),
    updated_at: fromNow({ days: -22 }),
  },
  {
    id: '44444444-4444-4444-8444-444444444404',
    brand_id: MOCK_BRAND.id,
    asset_type: 'BADGE',
    name: '1000 km badge',
    storage_path: `${MOCK_BRAND.id}/badge/1000km.png`,
    metadata: { width: 1024, height: 1024 },
    created_at: fromNow({ days: -18 }),
    updated_at: fromNow({ days: -18 }),
  },
];
