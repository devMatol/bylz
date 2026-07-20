import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface PageHeaderState {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

const PageHeaderContext = createContext<{
  header: PageHeaderState;
  setHeader: (h: PageHeaderState) => void;
}>({
  header: { title: "" },
  setHeader: () => {},
});

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeader] = useState<PageHeaderState>({ title: "" });
  return (
    <PageHeaderContext.Provider value={{ header, setHeader }}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeader() {
  return useContext(PageHeaderContext);
}

export function useSetPageHeader(state: PageHeaderState) {
  const { setHeader } = usePageHeader();
  useEffect(() => {
    setHeader(state);
    return () => setHeader({ title: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.title, state.subtitle]);
}
