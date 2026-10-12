import { Controller, Post, Body } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';

@ApiTags('Contacto')
@Controller('contact')
export class ContactController {
  constructor(private contactService: ContactService) {}

  @Post()
  @ApiOperation({ summary: 'Envía una consulta a la agencia (no requiere sesión)' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  create(@Body() dto: CreateContactDto) {
    return this.contactService.create(dto);
  }
}
