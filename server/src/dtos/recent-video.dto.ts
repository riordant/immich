import { ValidateUUID } from 'src/validation';

export class RecentVideoUpdateDto {
  @ValidateUUID({ description: 'The asset ID for the video to move to the front of the recent videos list' })
  assetId!: string;
}
