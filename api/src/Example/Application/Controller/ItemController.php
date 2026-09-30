<?php

declare(strict_types=1);

namespace Example\Application\Controller;

use Example\Application\Command\CreateItem\CreateItemCommand;
use Example\Application\Command\DeleteItem\DeleteItemCommand;
use Example\Application\Command\UpdateItem\UpdateItemCommand;
use Example\Application\Query\GetItem\GetItemQuery;
use Example\Application\Query\ListItems\ListItemsQuery;
use Shared\Application\Lib\AppController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapQueryParameter;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

final class ItemController extends AppController
{
    #[Route('/api/example/items', name: 'example_list_items', methods: ['GET'], format: 'json')]
    public function list(#[MapQueryParameter] ?string $status = null): JsonResponse
    {
        return $this->dispatchQuery(new ListItemsQuery($status));
    }

    #[Route('/api/example/items/{id}', name: 'example_get_item', methods: ['GET'], format: 'json')]
    public function get(string $id): JsonResponse
    {
        return $this->dispatchQuery(new GetItemQuery($id));
    }

    #[Route('/api/example/items', name: 'example_create_item', methods: ['POST'], format: 'json')]
    public function create(#[MapRequestPayload] CreateItemCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }

    #[Route('/api/example/items', name: 'example_update_item', methods: ['PUT'], format: 'json')]
    public function update(#[MapRequestPayload] UpdateItemCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }

    #[Route('/api/example/items', name: 'example_delete_item', methods: ['DELETE'], format: 'json')]
    public function delete(#[MapRequestPayload] DeleteItemCommand $cmd): JsonResponse
    {
        return $this->dispatch($cmd);
    }
}
