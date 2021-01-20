import fetch, { Response } from "cross-fetch";
import { act, renderHook } from "@testing-library/react-hooks";
import { useFetchJson } from "./useFetch";

jest.mock("cross-fetch");

describe("useFetchJson", () => {
  const mockedFetch = fetch as jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("should increment counter", () => {
    const expected = { msg: "hello world" };
    mockedFetch.mockReturnValue(
      new Promise((resolve) => resolve(new Response(JSON.stringify(expected))))
    );

    const { result } = renderHook(() => useFetchJson());

    expect(result.current.data).toBe(expected);
  });
});
