import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

const productSchema = new mongoose.Schema({
  code: String,
  product_name: String,
  brands: String,
  categories: String,
  ingredients_text: String,
  nutriments: Object,
}, { collection: 'openfoodfacts-products' });

const Product = mongoose.model('openfoodfacts-products', productSchema);

app.get('/api/products', async (req, res) => {
  try {
    const { code, name, brand, page = 1, limit = 10 } = req.query;
    const query = {};

    if (code) query.code = code;
    if (name) query.product_name = { $regex: name, $options: 'i' };
    if (brand) query.brands = { $regex: brand, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query).skip(skip).limit(parseInt(limit));

    res.json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: products,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching products', message: error.message });
  }
});


app.get('/api/products/:code', async (req, res) => {
  try {
    const product = await Product.findOne({ code: req.params.code });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching product', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
