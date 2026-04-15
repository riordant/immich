import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { ValidateUUID } from 'src/validation';

export class VideoPlaybackUpdateDto {
  @ValidateUUID({ description: 'The asset ID for the video playback position to update' })
  assetId!: string;

  @ApiProperty({
    type: 'integer',
    description: 'Playback position in whole seconds. Use 0 to clear saved progress.',
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  positionSeconds!: number;
}

export class VideoPlaybackResponseDto {
  @ValidateUUID({ description: 'The asset ID for the playback position response' })
  assetId!: string;

  @ApiPropertyOptional({
    type: 'integer',
    nullable: true,
    description: 'Saved playback position in whole seconds, or null if none is stored.',
    minimum: 0,
  })
  positionSeconds!: number | null;
}

export class VideoPlaybackEntryResponseDto {
  @ValidateUUID({ description: 'The asset ID for the playback position entry' })
  assetId!: string;

  @ApiProperty({
    type: 'integer',
    description: 'Saved playback position in whole seconds.',
    minimum: 1,
  })
  positionSeconds!: number;
}
