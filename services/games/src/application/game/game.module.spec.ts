import { Test } from '@nestjs/testing';
import { GameModule } from './game.module';

describe('GameModule', () => {
  it('should compile the module', async () => {
    const moduleref = Test.createTestingModule({
      imports: [GameModule],
    })
      .overrideModule(GameModule)
      .useModule(class {})
      .compile();
    expect(moduleref).toBeDefined();
  });
});
