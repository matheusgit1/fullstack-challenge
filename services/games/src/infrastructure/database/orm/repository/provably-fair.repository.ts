import { Inject, Injectable } from "@nestjs/common";
import { ProvablyFairSeed } from "../entites/provably-fair.entity";
import { Repository } from "typeorm";

@Injectable()
export class ProvablyFairRepository {
  constructor(
    @Inject(ProvablyFairSeed)
    private readonly provablyFairRepository: Repository<ProvablyFairSeed>,
  ) {}

  public async 
}
