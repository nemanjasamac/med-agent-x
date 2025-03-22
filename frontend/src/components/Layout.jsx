import Header from './Header';

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 p-6 bg-gray-50">
        {children}
      </main>

      <footer className="bg-white p-4 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} MedAgentX. All rights reserved.
      </footer>
    </div>
  );
}

export default Layout;
