// src/context/NavHintContext.jsx
// Allows individual pages to tell the Navbar which section is "active"
// when the URL alone is ambiguous (e.g. /movies/:id for a TV show).
import { createContext, useContext, useState, useCallback } from 'react';

const NavHintContext = createContext({ hint: null, setHint: () => {} });

export function NavHintProvider({ children }) {
  const [hint, setHintState] = useState(null); // e.g. '/tv' | '/movies' | null

  const setHint = useCallback((val) => setHintState(val), []);

  return (
    <NavHintContext.Provider value={{ hint, setHint }}>
      {children}
    </NavHintContext.Provider>
  );
}

export const useNavHint = () => useContext(NavHintContext);
