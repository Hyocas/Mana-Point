import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CardDetailPage from './pages/CardDetailPage';
import CartPage from './pages/CartPage';
import AccountPage from './pages/AccountPage';
import EditProfilePage from './pages/EditProfilePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="catalog" element={<HomePage />} />
          <Route path="carta/:id" element={<CardDetailPage />} />
          <Route path="carrinho" element={<CartPage />} />
          <Route path="minha-conta" element={<AccountPage />} />
          <Route path="editar-perfil" element={<EditProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
