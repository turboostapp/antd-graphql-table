import qs from "qs";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";

export function useQuery() {
  const location = useLocation();

  return useMemo(() => {
    return qs.parse(location.search, { ignoreQueryPrefix: true });
  }, [location]);
}
