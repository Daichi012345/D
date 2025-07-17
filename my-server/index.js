const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Recommendation = require('./models/Recommendation');
const History = require('./models/History');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// MongoDB 接続
mongoose.connect('mongodb://mongo:27017/myapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB 接続成功');
}).catch(err => {
  console.error('❌ MongoDB 接続失敗:', err);
});

// ユーザー登録API
app.post('/api/register', async (req, res) => {
  const { name, email, password, age, gender, allergy } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'このメールアドレスはすでに登録されています' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      age,
      gender,
      allergy
    });

    await user.save();

    const userWithoutPassword = {
      _id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      allergy: user.allergy,
      createdAt: user.createdAt
    };

    res.status(201).json({ message: '登録完了', user: userWithoutPassword });

  } catch (err) {
    console.error('❌ 登録失敗:', err);
    res.status(500).json({ message: 'サーバーエラー' });
  }
});

// ユーザーログインAPI
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'パスワードが正しくありません' });
    }

    const userWithoutPassword = {
      _id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      allergy: user.allergy,
      createdAt: user.createdAt
    };

    res.json({ message: 'ログイン成功', user: userWithoutPassword });

  } catch (err) {
    console.error('❌ ログイン処理エラー:', err);
    res.status(500).json({ message: 'サーバーエラー' });
  }
});

app.post('/api/history', async (req, res) => {
  const { userId, meal, mood } = req.body;

  try {
    const history = new History({
      userId,
      meal,
      mood,
    });

    await history.save();
    res.status(201).json({ message: '履歴保存成功', history });
  } catch (error) {
    console.error('❌ 履歴保存失敗:', error);
    res.status(500).json({ message: '履歴保存中にエラーが発生しました' });
  }
});

// 履歴取得API
app.get('/api/recommend/:userId', async (req, res) => {
  const history = await Recommendation.find({ userId: req.params.userId }).sort({ createdAt: -1 });
  res.json(history);
});

app.post('/api/recommend', async (req, res) => {
  const {
    userId,
    meal,
    mood,
    isFavorite = false,
    image,
    summary,
    instructions,
    ingredients
  } = req.body;

  try {
    const newRecommendation = new Recommendation({
      userId,
      meal,
      mood,
      isFavorite,
      image,
      summary,
      instructions,
      ingredients
    });

    await newRecommendation.save();
    res.status(201).json({ message: '保存成功', recommendation: newRecommendation });
  } catch (error) {
    console.error('❌ 保存エラー:', error);
    res.status(500).json({ message: '保存失敗' });
  }
});

app.get('/api/recommend/:userId', async (req, res) => {
  console.log('履歴取得リクエスト:', req.params.userId);
  try {
    const history = await Recommendation.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    console.error('❌ 履歴取得エラー:', error);
    res.status(500).json({ message: '履歴取得失敗' });
  }
});

// 履歴削除
app.delete('/api/recommend/:id', async (req, res) => {
  try {
    await Recommendation.findByIdAndDelete(req.params.id);
    res.json({ message: '削除成功' });
  } catch (err) {
    console.error('❌ 削除失敗:', err);
    res.status(500).json({ message: '削除失敗' });
  }
});

// ユーザー情報更新API（PATCH）
app.patch('/api/user/:id', async (req, res) => {
  const userId = req.params.id;
  const { name, email, age, gender, allergy } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, age, gender, allergy },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'ユーザーが見つかりません' });
    }

    const userWithoutPassword = {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      age: updatedUser.age,
      gender: updatedUser.gender,
      allergy: updatedUser.allergy,
      createdAt: updatedUser.createdAt
    };

    res.json({ message: '更新成功', user: userWithoutPassword });

  } catch (error) {
    console.error('❌ ユーザー更新エラー:', error);
    res.status(500).json({ message: '更新中にエラーが発生しました' });
  }
});

// 確認用ルート
app.get('/', (req, res) => {
  res.send('Hello from Docker + Express + MongoDB!');
});

app.listen(PORT, () => {
  console.log(`🚀 サーバー起動中: http://localhost:${PORT}`);
});
