# Country and Commodity Activation Model
**Version:** 1.0
**Effective:** 2026-08-04
**Authority:** AATOS Autonomous Execution Master Directive

---

## Purpose

AATOS has a continental product vision with staged commercial activation. This model ensures that:
- Platform capabilities do not exceed verified compliance coverage
- Users cannot transact in corridors without legal and operational readiness
- Marketing claims match actual platform state

---

## Country Activation States

Every country in the AATOS registry has exactly one activation status:

| Status | Code | Meaning |
|---|---|---|
| Inactive | `inactive` | Not visible to users |
| Registration only | `registration_only` | Users may register; no commercial features |
| Supplier onboarding | `supplier_onboarding` | Suppliers may create profiles; no transactions |
| Marketplace discovery | `marketplace_discovery` | Products visible; RFQs disabled |
| Pilot active | `pilot_active` | Full transaction workflow for approved corridor |
| Commercially active | `commercially_active` | Full commercial operation |
| Restricted | `restricted` | Temporarily suspended; existing deals complete |
| Suspended | `suspended` | All activity blocked |

### State Transitions

```
                    +------------------+
                    |    Inactive      |
                    +--------+---------+
                             |
                             v
                    +--------+---------+
                    | Registration Only|
                    +--------+---------+
                             |
              +--------------+--------------+
              v                             v
     +--------+---------+         +--------+---------+
     |Supplier Onboarding|         |Marketplace Discovery|
     +--------+---------+         +--------+---------+
              |                             |
              v                             v
     +--------+---------+         +--------+---------+
     |  Pilot Active    |<------->| Commercially Active|
     +--------+---------+         +--------+---------+
              |                             |
              +--------------+--------------+
                             v
                    +--------+---------+
                    |   Restricted     |
                    +--------+---------+
                             |
                             v
                    +--------+---------+
                    |   Suspended      |
                    +------------------+
```

---

## Commodity Activation States

Every commodity has a status by origin and destination corridor:

| Status | Code | Meaning |
|---|---|---|
| Catalog only | `catalog_only` | Exists in taxonomy; no listings |
| Listings enabled | `listings_enabled` | Suppliers may list products |
| Verification enabled | `verification_enabled` | Product verification workflow active |
| Compliance mapped | `compliance_mapped` | Compliance rules populated for corridor |
| Buyer discovery enabled | `buyer_discovery_enabled` | Buyers may find and RFQ |
| RFQ enabled | `rfq_enabled` | Full RFQ workflow |
| Transactions enabled | `transactions_enabled` | Full deal and payment workflow |
| Restricted | `restricted` | Existing deals complete; no new deals |
| Suspended | `suspended` | All activity blocked |

---

## Product Readiness Levels

Every product listing shows a readiness level:

| Level | Code | Meaning |
|---|---|---|
| Listed | `listed` | Product created, not reviewed |
| Supplier verified | `supplier_verified` | Supplier meets verification threshold |
| Product verified | `product_verified` | Product attributes verified |
| Export ready | `export_ready` | Export documents complete |
| Corridor ready | `corridor_ready` | Compliance satisfied for destination |
| Shipment ready | `shipment_ready` | Inspection passed, payment staged |

---

## Current State

### Countries

| Country | Code | Status | Notes |
|---|---|---|---|
| Kenya | KE | `pilot_active` | Origin country for pilot |
| United States | US | `pilot_active` | Destination country for pilot |
| All other countries | — | `catalog_only` | In taxonomy, not activated |

### Commodities

| Commodity | Corridor | Status | Notes |
|---|---|---|---|
| Green specialty coffee | KE → US | `transactions_enabled` | Pilot commodity |
| All other commodities | All corridors | `catalog_only` | In taxonomy, not activated |

---

## Enforcement

The platform must check activation status before allowing:
- Product listing (commodity must be `listings_enabled` or higher)
- RFQ creation (commodity must be `rfq_enabled` or higher)
- Deal creation (commodity must be `transactions_enabled`)
- Payment initiation (corridor must be `pilot_active` or `commercially_active`)

---

## Database Implementation

```sql
-- Country activation
ALTER TABLE countries ADD COLUMN activation_status VARCHAR(32) NOT NULL DEFAULT 'inactive';
ALTER TABLE countries ADD COLUMN activated_at TIMESTAMP NULL;
ALTER TABLE countries ADD COLUMN activated_by VARCHAR(255) NULL;

-- Corridor commodity activation
CREATE TABLE corridor_commodity_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  origin_country_code CHAR(2) NOT NULL,
  destination_country_code CHAR(2) NOT NULL,
  commodity_id UUID NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'catalog_only',
  activated_at TIMESTAMP NULL,
  activated_by VARCHAR(255) NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(origin_country_code, destination_country_code, commodity_id)
);

-- Product readiness
ALTER TABLE products ADD COLUMN readiness_level VARCHAR(32) NOT NULL DEFAULT 'listed';
```

---

*This model ensures AATOS never implies readiness that does not exist.*
