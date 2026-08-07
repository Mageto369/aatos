import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdvancedSearchService, SearchFilters } from './advanced-search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Search')
@Controller('search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly searchService: AdvancedSearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search across all entities' })
  async search(
    @Query('q') query: string,
    @Query('type') type?: string,
    @Query('country') country?: string,
    @Query('category') category?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: SearchFilters = {};
    if (type) filters.type = type.split(',');
    if (country) filters.country = country.split(',');
    if (category) filters.category = category.split(',');

    return this.searchService.search(query || '', filters, limit ? parseInt(limit, 10) : 20);
  }

  @Get('autocomplete')
  @ApiOperation({ summary: 'Autocomplete suggestions' })
  async autocomplete(
    @Query('q') prefix: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
  ) {
    return this.searchService.autocomplete(prefix || '', type, limit ? parseInt(limit, 10) : 10);
  }

  @Get('facets')
  @ApiOperation({ summary: 'Get search facets' })
  async facets(@Query('type') type?: string) {
    return this.searchService.getFacets(type);
  }
}
