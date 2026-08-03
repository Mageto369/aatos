import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Product } from '../products/entities/product.entity';
import { ProductCategory } from '../products/entities/product-category.entity';

export async function seedDatabase(dataSource: DataSource): Promise<void> {
  console.log('Seeding database...');

  const orgRepo = dataSource.getRepository(Organization);
  const userRepo = dataSource.getRepository(User);
  const productRepo = dataSource.getRepository(Product);
  const categoryRepo = dataSource.getRepository(ProductCategory);

  // Seed product categories
  const categories = [
    { name: 'Coffee', description: 'Green and roasted coffee beans' },
    { name: 'Tea', description: 'Black, green, and herbal teas' },
    { name: 'Spices', description: 'Pepper, turmeric, cardamom, etc.' },
    { name: 'Nuts', description: 'Cashews, macadamia, almonds' },
    { name: 'Grains', description: 'Rice, quinoa, millet' },
  ];

  for (const cat of categories) {
    const exists = await categoryRepo.findOne({ where: { name: cat.name } });
    if (!exists) {
      await categoryRepo.save(cat);
      console.log(`Created category: ${cat.name}`);
    }
  }

  // Seed demo organizations
  const orgs = [
    {
      name: 'Nairobi Coffee Cooperative',
      type: 'cooperative',
      country: 'KE',
      city: 'Nairobi',
      address: 'Industrial Area, Enterprise Road',
      email: 'info@nairobicoffee.co.ke',
      phone: '+254 20 123 4567',
      verified: true,
    },
    {
      name: 'US Specialty Coffee Imports',
      type: 'importer',
      country: 'US',
      city: 'New York',
      address: '123 Trade Center Blvd',
      email: 'orders@usspecialtycoffee.com',
      phone: '+1 212 555 0100',
      verified: true,
    },
  ];

  for (const orgData of orgs) {
    const exists = await orgRepo.findOne({ where: { name: orgData.name } });
    if (!exists) {
      await orgRepo.save(orgData);
      console.log(`Created organization: ${orgData.name}`);
    }
  }

  // Seed demo products
  const coffeeCategory = await categoryRepo.findOne({ where: { name: 'Coffee' } });
  if (coffeeCategory) {
    const products = [
      {
        name: 'Kenya AA Green Coffee',
        description: 'Premium Kenyan AA grade green coffee beans',
        categoryId: coffeeCategory.id,
        origin: 'KE',
        certifications: ['Organic', 'Fair Trade'],
        minOrderQty: 1000,
        unit: 'kg',
        basePrice: 8.5,
        currency: 'USD',
        active: true,
      },
      {
        name: 'Ethiopian Yirgacheffe',
        description: 'Single-origin Ethiopian Yirgacheffe',
        categoryId: coffeeCategory.id,
        origin: 'ET',
        certifications: ['Organic'],
        minOrderQty: 500,
        unit: 'kg',
        basePrice: 9.2,
        currency: 'USD',
        active: true,
      },
    ];

    for (const prod of products) {
      const exists = await productRepo.findOne({ where: { name: prod.name } });
      if (!exists) {
        await productRepo.save(prod);
        console.log(`Created product: ${prod.name}`);
      }
    }
  }

  console.log('Database seeding complete.');
}
