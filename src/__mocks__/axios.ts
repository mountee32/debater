import { AxiosStatic } from 'axios';

class AxiosHeaders {
  constructor() {
    return {};
  }
}

const mockAxios = jest.createMockFromModule<AxiosStatic>('axios');

mockAxios.create = jest.fn(() => mockAxios);
mockAxios.get = jest.fn();
mockAxios.post = jest.fn();
mockAxios.put = jest.fn();
mockAxios.delete = jest.fn();
mockAxios.AxiosHeaders = AxiosHeaders;

export default mockAxios;
