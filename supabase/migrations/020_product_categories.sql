-- Standardize product categories to the 14 canonical SellBop marketplace categories.

UPDATE products SET category = 'Business & Marketing' WHERE category = 'Business';
UPDATE products SET category = 'Money & Finance' WHERE category = 'Money';
UPDATE products SET category = 'Health & Fitness' WHERE category = 'Fitness';
UPDATE products SET category = 'Education & Career' WHERE category = 'Education';
UPDATE products SET category = 'Faith & Spirituality' WHERE category = 'Faith';
UPDATE products SET category = 'Creative & Design' WHERE category = 'Design';
UPDATE products SET category = 'Other' WHERE category = 'Templates';
