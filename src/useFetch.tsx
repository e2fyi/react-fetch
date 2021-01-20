import AbortController from "node-abort-controller";
import fetch, { Request } from "cross-fetch";
import React from "react";

export function useFetchResponse(input?: RequestInfo, init?: RequestInit) {
  const [loading, setLoading] = React.useState<boolean>(false);
  const [response, setResponse] = React.useState<undefined | Response>(
    undefined
  );
  const [error, setError] = React.useState<undefined | Error>(undefined);
  const [refetch, setRefetch] = React.useState<
    undefined | ((input: RequestInfo, init?: RequestInit) => void)
  >(undefined);
  const [controller, setController] = React.useState<
    undefined | AbortController
  >(undefined);

  React.useEffect(() => {
    let mounted = true;
    const refetchFunc = (input_: RequestInfo, init_?: RequestInit) => {
      setLoading(true);
      setResponse(undefined);
      setError(undefined);
      if (controller) controller.abort();
      const abortController = new AbortController();
      const signal = abortController.signal;
      const params = init_ ? { ...init_, signal } : { signal };
      setController(abortController);
      fetch(new Request(input_, params))
        .then(
          (res) => {
            if (!mounted) return;
            if (!res.ok) {
              setError(new Error(`[${res.status}] ${res.statusText}`));
            }
            setResponse(res);
          },
          (err) => mounted && setError(err)
        )
        .finally(() => mounted && setLoading(false));
    };
    setRefetch(refetchFunc);
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    let mounted = true;
    const cleanup = () => {
      mounted = false;
    };
    if (!input || !refetch) return cleanup;
    console.log("fetch")
    refetch(input, init);
    return cleanup;
  }, [input, init, refetch]);

  return { loading, response, error, abort: controller?.abort, refetch };
}

function createUseFetch<T = unknown>(get: (resp: Response) => Promise<T>) {
  return (input?: RequestInfo, init?: RequestInit) => {
    const [data, setData] = React.useState<undefined | T>(undefined);
    const [error, setError] = React.useState<undefined | Error>(undefined);
    const { response, error: fetchError, ...rest } = useFetchResponse(
      input,
      init
    );

    React.useEffect(() => {
      let mounted = true;
      if (response) {
        get(response).then(
          (res) => mounted && setData(res),
          (err) => mounted && setError(err)
        );
      }
      return () => {
        mounted = false;
      };
    }, [response]);

    return { data, response, error: error || fetchError, ...rest };
  };
}

export const useFetchForm = createUseFetch<FormData>((response) =>
  response.formData()
);
export const useFetchJson = createUseFetch<any>((response) => response.json());
export const useFetchBlob = createUseFetch<Blob>((response) => response.blob());
export const useFetchArrayBuffer = createUseFetch<ArrayBuffer>((response) =>
  response.arrayBuffer()
);
export const useFetchText = createUseFetch<string>((response) =>
  response.text()
);
