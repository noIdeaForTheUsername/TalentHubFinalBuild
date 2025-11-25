import { ReadableClassPipe } from './readable-class.pipe-pipe';

describe('ReadableClassPipe', () => {
  it('create an instance', () => {
    const pipe = new ReadableClassPipe();
    expect(pipe).toBeTruthy();
  });
});
